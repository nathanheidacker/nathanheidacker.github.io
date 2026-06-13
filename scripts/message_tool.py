#!/usr/bin/env python3
"""
Tool for publishing / reading the secret message shown at /messages.

It mirrors the browser crypto in app/messages/page.tsx + message.tsx exactly:

    passHash = SHA256(password)                       -> stored in page.tsx
    key      = PBKDF2(passHash_hex, salt="",          -> AES-GCM-256 key
                      iterations=100000, hash=SHA256)
    cipher   = AES-GCM(key, iv=12 zero bytes).encrypt(message_utf8)
    base64(cipher + 16-byte GCM tag)                   -> message.tsx

On --write the base64 is appended as a new incrementing constant
(MESSAGE -> MESSAGE2 -> MESSAGE3 -> ...) and the default export is repointed
to it. Older messages are kept as history; only the export moves.

You pick the password yourself. The message body supports the same little
markup the page renders:
    "#text"   -> large heading
    "##text"  -> bold sub-heading
    other     -> a paragraph (raw HTML allowed, e.g. <a href=...>)
    blank line-> spacing

USAGE
-----
Encrypt a new message and write it straight into the site:

    python3 scripts/message_tool.py encrypt \
        --password "your secret here" \
        --in path/to/message.txt \
        --write

Encrypt and just print the values (don't touch any files):

    python3 scripts/message_tool.py encrypt -p "secret" -i message.txt

Read back / verify the current message:

    python3 scripts/message_tool.py decrypt -p "secret"

Every encrypt does an automatic decrypt round-trip and aborts if it
doesn't match, so a successful run is guaranteed to be readable by the site.
"""

import argparse
import base64
import hashlib
import re
import sys
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# --- locations -------------------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent
MESSAGE_TSX = ROOT / "app" / "messages" / "message.tsx"
PAGE_TSX = ROOT / "app" / "messages" / "page.tsx"

ITERATIONS = 100_000
IV = bytes(12)  # 12 zero bytes, matching `new Uint8Array(12)` in the browser


# --- crypto (faithful port of the browser logic) --------------------------
def pass_hash(password: str) -> str:
    """SHA256(password) as lowercase hex -- the value compared in page.tsx."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def derive_key(password: str) -> bytes:
    """PBKDF2 over the *hash hex string*, exactly like generateKeyFromPassword(result)."""
    hash_hex = pass_hash(password)
    return hashlib.pbkdf2_hmac(
        "sha256", hash_hex.encode("utf-8"), b"", ITERATIONS, dklen=32
    )


def encrypt(password: str, message: str) -> str:
    key = derive_key(password)
    cipher = AESGCM(key).encrypt(IV, message.encode("utf-8"), None)
    return base64.b64encode(cipher).decode("ascii")


def decrypt(password: str, b64_cipher: str) -> str:
    key = derive_key(password)
    cipher = base64.b64decode(b64_cipher)
    return AESGCM(key).decrypt(IV, cipher, None).decode("utf-8")


# --- file editing ----------------------------------------------------------
def read_current_message_b64() -> str:
    """Pull the base64 string of the active message (MESSAGE2 / default export)."""
    text = MESSAGE_TSX.read_text()
    export_match = re.search(r"export\s+default\s+(\w+)\s*;", text)
    if not export_match:
        raise SystemExit("Could not find the default export in message.tsx")
    name = export_match.group(1)
    const_match = re.search(
        rf'const\s+{name}\s*=\s*"([^"]*)"\s*;', text, re.DOTALL
    )
    if not const_match:
        raise SystemExit(f"Could not find the {name} constant in message.tsx")
    return const_match.group(1)


def _message_number(name: str) -> int:
    """MESSAGE -> 1, MESSAGE2 -> 2, MESSAGE3 -> 3, ..."""
    suffix = name[len("MESSAGE"):]
    return int(suffix) if suffix else 1


def add_new_message(b64_cipher: str) -> str:
    """Append a new incrementing MESSAGE<n> const and point the default export at it.

    Existing messages are kept (history is preserved); only the default export
    moves to the newly added constant. Returns the new constant's name.
    """
    text = MESSAGE_TSX.read_text()

    names = re.findall(r"const\s+(MESSAGE\d*)\s*=", text)
    next_num = max((_message_number(n) for n in names), default=0) + 1
    new_name = f"MESSAGE{next_num}"

    new_const = f'const {new_name} =\n    "{b64_cipher}";\n\n'

    # Insert the new const just before the default export and repoint it.
    new_text, n = re.subn(
        r"export\s+default\s+\w+\s*;",
        # lambda repl -> treated literally, so no escaping of +/ in base64
        lambda m: new_const + f"export default {new_name};",
        text,
        count=1,
    )
    if n != 1:
        raise SystemExit("Could not find the default export in message.tsx")

    MESSAGE_TSX.write_text(new_text)
    return new_name


def write_pass_hash(hash_hex: str) -> None:
    """Update the passHash constant inside page.tsx."""
    text = PAGE_TSX.read_text()
    new_text, n = re.subn(
        r'(const\s+passHash\s*=\s*\n?\s*")[0-9a-fA-F]+(")',
        lambda m: m.group(1) + hash_hex + m.group(2),
        text,
    )
    if n != 1:
        raise SystemExit(f"Expected to replace exactly one passHash, replaced {n}")
    PAGE_TSX.write_text(new_text)


# --- commands --------------------------------------------------------------
def cmd_encrypt(args: argparse.Namespace) -> None:
    if args.in_file:
        message = Path(args.in_file).read_text()
    elif args.message is not None:
        message = args.message
    else:
        print("Enter message, then Ctrl-D (Ctrl-Z on Windows):", file=sys.stderr)
        message = sys.stdin.read()

    # Trailing newline from a text editor would change the ciphertext; drop one.
    message = message.rstrip("\n")
    if not message:
        raise SystemExit("Refusing to encrypt an empty message.")

    b64 = encrypt(args.password, message)

    # Safety: prove it round-trips before we touch anything.
    if decrypt(args.password, b64) != message:
        raise SystemExit("Round-trip verification FAILED -- aborting, files untouched.")

    h = pass_hash(args.password)

    if args.write:
        name = add_new_message(b64)
        write_pass_hash(h)
        print(f"Added {name} to {MESSAGE_TSX.relative_to(ROOT)} (now the default "
              f"export) and updated {PAGE_TSX.relative_to(ROOT)} (passHash).")
        print("Round-trip verified. Reload /messages and unlock with your password.")
    else:
        print("# passHash (paste into app/messages/page.tsx):")
        print(h)
        print()
        print("# MESSAGE base64 (paste into app/messages/message.tsx):")
        print(b64)
        print()
        print("Round-trip verified. Re-run with --write to apply automatically.")


def cmd_decrypt(args: argparse.Namespace) -> None:
    b64 = args.cipher or read_current_message_b64()
    try:
        print(decrypt(args.password, b64))
    except Exception as exc:  # noqa: BLE001
        raise SystemExit(f"Decryption failed (wrong password?): {exc}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    enc = sub.add_parser("encrypt", help="encrypt a new message")
    enc.add_argument("-p", "--password", required=True, help="the password you choose")
    src = enc.add_mutually_exclusive_group()
    src.add_argument("-i", "--in", dest="in_file", help="read message body from a file")
    src.add_argument("-m", "--message", help="message body as a literal string")
    enc.add_argument("--write", action="store_true",
                     help="write directly into message.tsx and page.tsx")
    enc.set_defaults(func=cmd_encrypt)

    dec = sub.add_parser("decrypt", help="decrypt / verify the current message")
    dec.add_argument("-p", "--password", required=True)
    dec.add_argument("-c", "--cipher", help="base64 to decrypt (default: current site message)")
    dec.set_defaults(func=cmd_decrypt)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
