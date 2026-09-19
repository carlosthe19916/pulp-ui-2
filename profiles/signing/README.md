# signing

Registers a generic Pulp **signing service** for local development. Signing services cannot be
created through the UI — they must be created on the backend with a GPG key and a signing script
present in the pulp container. This profile does that automatically on `oci-env compose up`.

## Usage

Activate alongside other profiles via `COMPOSE_PROFILE` in `compose.env` (colon-separated):

```
COMPOSE_PROFILE=pulp-ui-2/keycloak:pulp-ui-2/signing
```

Then:

```bash
oci-env -e compose.env compose up
```

## What it does

On startup, after `pulpcore-api` is up, `init.sh` runs (as root) inside the pulp container and:

1. Generates a passphrase-less 4096-bit dev GPG key (`GPG_EMAIL`, default `pulp@example.com`)
   into the pulp-owned keyring `/var/lib/pulp/.gnupg`.
2. Registers one `core:AsciiArmoredDetachedSigningService` named `SIGNING_SERVICE_NAME`
   (default `pulp-ui-dev-signing`) via `pulpcore-manager add-signing-service`, pointing at
   `sign_metadata.sh`.

Both steps are idempotent, so re-running `compose up` neither duplicates the service nor errors.

## Verify

```bash
# via management shell
oci-env -e compose.env pulpcore-manager shell -c \
  "from pulpcore.app.models import SigningService; print(list(SigningService.objects.values_list('name','pubkey_fingerprint')))"

# or via API (direct port)
curl http://localhost:5003/api/pulp/api/v3/signing-services/
```

## Variables

See `profile_default_config.env`: `SIGNING_SERVICE_NAME`, `GPG_EMAIL`. Override in `compose.env`.

## Notes

- Only the generic `core:AsciiArmoredDetachedSigningService` is created. None of the installed
  plugins (pulpcore/pulp_python/pulp_npm) _consume_ signing services, so this mainly makes a
  signing service exist in the API/UI. rpm/deb metadata signing uses this same class once those
  plugins are added to `DEV_SOURCE_PATH`.
- Dev-only, passphrase-less key — never reuse outside local dev. The keyring lives on the
  persistent `oci_pulp` volume; `oci-env db reset` wipes it and `init.sh` regenerates it.
