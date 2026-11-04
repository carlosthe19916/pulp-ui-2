# Hugging Face example

Companion to the [Hugging Face model cache](../../website/docs/tutorials/hugging_face.mdx) tutorial.

| Path               | What it is                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| `load_model.py`    | Downloads `hf-internal-testing/tiny-random-bert` through Pulp with `huggingface_hub`.            |
| `requirements.txt` | `huggingface_hub`, which also provides the `hf` CLI.                                             |
| `setup.sh`         | Creates `hf-proxy` (pull-through to huggingface.co). Set `HF_TOKEN` for private or gated models. |
| `demo.sh`          | Downloads a model file with `hf`, then runs `load_model.py`.                                     |

Requires `curl`, `jq` and Python 3.9+.

```bash
cp .env.example .env   # adjust for your Pulp server
./setup.sh
./demo.sh
```

demo.sh uses a throwaway virtual environment and Hugging Face cache (`.hf-demo/`), so every
file really comes from Pulp.
