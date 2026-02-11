import type {
  UniquePackageMetadataResponse,
  UniquePackageResponse,
} from "@app/api/models";
import type {
  PaginatedpythonPythonPackageContentResponseList,
  PythonPythonPackageContentResponse,
} from "@app/client";

export const packagesMock: PaginatedpythonPythonPackageContentResponseList = {
  count: 31021,
  next: "https://packages.redhat.com/api/pulp/calunga-ui-dev/api/v3/content/python/packages/?limit=10&offset=10",
  previous: undefined,
  results: [
    {
      pulp_href:
        "/api/pulp/calunga-ui-dev/api/v3/content/python/packages/019c2f07-9ca7-7a92-bc46-13f9fa132adb/",
      prn: "prn:python.pythonpackagecontent:019c2f07-9ca7-7a92-bc46-13f9fa132adb",
      pulp_created: "2026-02-05T18:19:26.152578Z",
      pulp_last_updated: "2026-02-05T18:19:26.152597Z",
      pulp_labels: {},
      vuln_report: undefined,
      artifact: undefined,
      author: "",
      author_email: "Ronny Pfannschmidt <opensource@ronnypfannschmidt.de>",
      description:
        '# setuptools-scm\n[![github ci](https://github.com/pypa/setuptools-scm/actions/workflows/python-tests.yml/badge.svg)](https://github.com/pypa/setuptools-scm/actions/workflows/python-tests.yml)\n[![Documentation Status](https://readthedocs.org/projects/setuptools-scm/badge/?version=latest)](https://setuptools-scm.readthedocs.io/en/latest/?badge=latest)\n[![tidelift](https://tidelift.com/badges/package/pypi/setuptools-scm) ](https://tidelift.com/subscription/pkg/pypi-setuptools-scm?utm_source=pypi-setuptools-scm&utm_medium=readme)\n\n## about\n\n[setuptools-scm] extracts Python package versions from `git` or `hg` metadata\ninstead of declaring them as the version argument\nor in a Source Code Managed (SCM) managed file.\n\nAdditionally [setuptools-scm] provides `setuptools` with a list of\nfiles that are managed by the SCM\n<br/>\n(i.e. it automatically adds all the SCM-managed files to the sdist).\n<br/>\nUnwanted files must be excluded via `MANIFEST.in`\nor [configuring Git archive][git-archive-docs].\n\n> **⚠️ Important:** Installing setuptools-scm automatically enables a file finder that includes **all SCM-tracked files** in your source distributions. This can be surprising if you have development files tracked in Git/Mercurial that you don\'t want in your package. Use `MANIFEST.in` to exclude unwanted files. See the [documentation] for details.\n\n## `pyproject.toml` usage\n\nThe preferred way to configure [setuptools-scm] is to author\nsettings in a `tool.setuptools_scm` section of `pyproject.toml`.\n\nThis feature requires setuptools 61 or later (recommended: >=80 for best compatibility).\nFirst, ensure that [setuptools-scm] is present during the project\'s\nbuild step by specifying it as one of the build requirements.\n\n```toml title="pyproject.toml"\n[build-system]\nrequires = ["setuptools>=80", "setuptools-scm>=8"]\nbuild-backend = "setuptools.build_meta"\n```\n\nThat will be sufficient to require [setuptools-scm] for projects\nthat support [PEP 518] like [pip] and [build].\n\n[pip]: https://pypi.org/project/pip\n[build]: https://pypi.org/project/build\n[PEP 518]: https://peps.python.org/pep-0518/\n\n\nTo enable version inference, you need to set the version\ndynamically in the `project` section of `pyproject.toml`:\n\n```toml title="pyproject.toml"\n[project]\n# version = "0.0.1"  # Remove any existing version parameter.\ndynamic = ["version"]\n\n[tool.setuptools_scm]\n```\n\n!!! note "Simplified Configuration"\n\n    Starting with setuptools-scm 8.1+, if `setuptools_scm` (or `setuptools-scm`) is\n    present in your `build-system.requires`, the `[tool.setuptools_scm]` section\n    becomes optional! You can now enable setuptools-scm with just:\n\n    ```toml title="pyproject.toml"\n    [build-system]\n    requires = ["setuptools>=80", "setuptools-scm>=8"]\n    build-backend = "setuptools.build_meta"\n\n    [project]\n    dynamic = ["version"]\n    ```\n\n    The `[tool.setuptools_scm]` section is only needed if you want to customize\n    configuration options.\n\nAdditionally, a version file can be written by specifying:\n\n```toml title="pyproject.toml"\n[tool.setuptools_scm]\nversion_file = "pkg/_version.py"\n```\n\nWhere `pkg` is the name of your package.\n\nIf you need to confirm which version string is being generated or debug the configuration,\nyou can install [setuptools-scm] directly in your working environment and run:\n\n```console\n$ python -m setuptools_scm\n# To explore other options, try:\n$ python -m setuptools_scm --help\n```\n\nFor further configuration see the [documentation].\n\n[setuptools-scm]: https://github.com/pypa/setuptools-scm\n[documentation]: https://setuptools-scm.readthedocs.io/\n[git-archive-docs]: https://setuptools-scm.readthedocs.io/en/stable/usage/#builtin-mechanisms-for-obtaining-version-numbers\n\n\n## Interaction with Enterprise Distributions\n\nSome enterprise distributions like RHEL7\nship rather old setuptools versions.\n\nIn those cases its typically possible to build by using an sdist against `setuptools-scm<2.0`.\nAs those old setuptools versions lack sensible types for versions,\nmodern [setuptools-scm] is unable to support them sensibly.\n\nIt\'s strongly recommended to build a wheel artifact using modern Python and setuptools,\nthen installing the artifact instead of trying to run against old setuptools versions.\n\n!!! note "Legacy Setuptools Support"\n    While setuptools-scm recommends setuptools >=80, it maintains compatibility with setuptools 61+\n    to support legacy deployments that cannot easily upgrade. Support for setuptools <80 is deprecated\n    and will be removed in a future release. This allows enterprise environments and older CI/CD systems\n    to continue using setuptools-scm while still encouraging adoption of newer versions.\n\n\n## Code of Conduct\n\n\nEveryone interacting in the [setuptools-scm] project\'s codebases, issue\ntrackers, chat rooms, and mailing lists is expected to follow the\n[PSF Code of Conduct].\n\n[PSF Code of Conduct]: https://github.com/pypa/.github/blob/main/CODE_OF_CONDUCT.md\n\n\n## Security Contact\n\nTo report a security vulnerability, please use the\n[Tidelift security contact](https://tidelift.com/security).\nTidelift will coordinate the fix and disclosure.\n',
      home_page: "",
      keywords: "",
      license:
        'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. ',
      metadata_version: "",
      name: "setuptools-scm",
      platform: "",
      summary: "the blessed package to manage your versions by scm tags",
      version: "7.1.0",
      classifiers:
        '["Development Status :: 5 - Production/Stable", "Intended Audience :: Developers", "License :: OSI Approved :: MIT License", "Programming Language :: Python", "Programming Language :: Python :: 3 :: Only", "Programming Language :: Python :: 3.8", "Programming Language :: Python :: 3.9", "Programming Language :: Python :: 3.10", "Programming Language :: Python :: 3.11", "Programming Language :: Python :: 3.12", "Programming Language :: Python :: 3.13", "Topic :: Software Development :: Libraries", "Topic :: Software Development :: Version Control", "Topic :: System :: Software Distribution", "Topic :: Utilities"]',
      download_url: "",
      supported_platform: "",
      maintainer: "",
      maintainer_email: "",
      obsoletes_dist: "[]",
      project_url: "",
      project_urls:
        '["documentation, https://setuptools-scm.readthedocs.io/", "repository, https://github.com/pypa/setuptools-scm/"]',
      provides_dist: "[]",
      requires_external: "[]",
      requires_dist:
        '["packaging>=20", "setuptools", "tomli>=1; python_version < \\"3.11\\"", "typing-extensions; python_version < \\"3.10\\"", "rich; extra == \\"rich\\""]',
      requires_python: ">=3.7",
      description_content_type: "text/markdown",
      provides_extras: '["rich", "simple", "toml"]',
      dynamic: '["license-file"]',
      license_expression: "",
      license_file: '["LICENSE"]',
      filename: "setuptools_scm-7.1.0-2-py3-none-any.whl",
      packagetype: "bdist_wheel",
      python_version: "py3",
      size: 44849,
      sha256:
        "ffb45476a6022e9e5b92c7ee3e477dfe30d121284115bb80670bcbc6bf346798",
      metadata_sha256: undefined,
      provenance: undefined,
    },
    {
      pulp_href:
        "/api/pulp/calunga-ui-dev/api/v3/content/python/packages/019c2f07-a714-770a-a9d6-e09d35bed431/",
      prn: "prn:python.pythonpackagecontent:019c2f07-a714-770a-a9d6-e09d35bed431",
      pulp_created: "2026-02-05T18:19:26.142803Z",
      pulp_last_updated: "2026-02-05T18:19:26.142823Z",
      pulp_labels: {},
      vuln_report: undefined,
      artifact: undefined,
      author: "Julien Danjou",
      author_email: "julien@danjou.info",
      description:
        "Tenacity is a general-purpose retrying library to simplify the task of adding retry behavior to just about anything.\n",
      home_page: "https://github.com/jd/tenacity",
      keywords: "",
      license: "Apache 2.0",
      metadata_version: "",
      name: "tenacity",
      platform: "",
      summary: "Retry code until it succeeds",
      version: "9.1.2",
      classifiers:
        '["Intended Audience :: Developers", "License :: OSI Approved :: Apache Software License", "Programming Language :: Python", "Programming Language :: Python :: 3", "Programming Language :: Python :: 3 :: Only", "Programming Language :: Python :: 3.9", "Programming Language :: Python :: 3.10", "Programming Language :: Python :: 3.11", "Programming Language :: Python :: 3.12", "Programming Language :: Python :: 3.13", "Topic :: Utilities"]',
      download_url: "",
      supported_platform: "",
      maintainer: "",
      maintainer_email: "",
      obsoletes_dist: "[]",
      project_url: "",
      project_urls: "null",
      provides_dist: "[]",
      requires_external: "[]",
      requires_dist:
        '["reno; extra == \\"doc\\"", "sphinx; extra == \\"doc\\"", "pytest; extra == \\"test\\"", "tornado>=4.5; extra == \\"test\\"", "typeguard; extra == \\"test\\""]',
      requires_python: ">=3.9",
      description_content_type: "",
      provides_extras: '["doc", "test"]',
      dynamic: '["license-file"]',
      license_expression: "",
      license_file: '["LICENSE"]',
      filename: "tenacity-9.1.2-2-py3-none-any.whl",
      packagetype: "bdist_wheel",
      python_version: "py3",
      size: 29286,
      sha256:
        "f899d6e84ba433c9bd0c2d86220a4503e66c06cfbda883f71d1f4fb55796d01a",
      metadata_sha256: undefined,
      provenance: undefined,
    },
    {
      pulp_href:
        "/api/pulp/calunga-ui-dev/api/v3/content/python/packages/019c2f07-b2ab-782b-9c42-57c66ef4953f/",
      prn: "prn:python.pythonpackagecontent:019c2f07-b2ab-782b-9c42-57c66ef4953f",
      pulp_created: "2026-02-05T18:19:26.132053Z",
      pulp_last_updated: "2026-02-05T18:19:26.132070Z",
      pulp_labels: {},
      vuln_report: undefined,
      artifact: undefined,
      author: "",
      author_email: '"Astral Software Inc." <hey@astral.sh>',
      description:
        '# ty\n\n[![ty](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ty/main/assets/badge/v0.json)](https://github.com/astral-sh/ty)\n[![PyPI](https://img.shields.io/pypi/v/ty.svg)](https://pypi.python.org/pypi/ty)\n[![Discord](https://img.shields.io/badge/Discord-%235865F2.svg?logo=discord&logoColor=white)](https://discord.com/invite/astral-sh)\n\nAn extremely fast Python type checker and language server, written in Rust.\n\n<br />\n\n<p align="center">\n  <img alt="Shows a bar chart with benchmark results." width="500px" src="https://raw.githubusercontent.com/astral-sh/ty/main/docs/assets/ty-benchmark-cli-light.svg">\n</p>\n\n<p align="center">\n  <i>Type checking the <a href="https://github.com/home-assistant/core">home-assistant</a> project without caching.</i>\n</p>\n\n<br />\n\nty is backed by [Astral](https://astral.sh), the creators of\n[uv](https://github.com/astral-sh/uv) and [Ruff](https://github.com/astral-sh/ruff).\n\n## Highlights\n\n- 10x - 100x faster than mypy and Pyright\n- Comprehensive [diagnostics](https://docs.astral.sh/ty/features/diagnostics/) with rich contextual information\n- Configurable [rule levels](https://docs.astral.sh/ty/rules/), [per-file overrides](https://docs.astral.sh/ty/reference/configuration/#overrides), [suppression comments](https://docs.astral.sh/ty/suppression/), and first-class project support\n- Designed for adoption, with support for [redeclarations](https://docs.astral.sh/ty/features/type-system/#redeclarations) and [partially typed code](https://docs.astral.sh/ty/features/type-system/#gradual-guarantee)\n- [Language server](https://docs.astral.sh/ty/features/language-server/) with code navigation, completions, code actions, auto-import, inlay hints, on-hover help, etc.\n- Fine-grained [incremental analysis](https://docs.astral.sh/ty/features/language-server/#fine-grained-incrementality) designed for fast updates when editing files in an IDE\n- Editor integrations for [VS Code](https://docs.astral.sh/ty/editors/#vs-code), [PyCharm](https://docs.astral.sh/ty/editors/#pycharm), [Neovim](https://docs.astral.sh/ty/editors/#neovim) and more\n- Advanced typing features like first-class [intersection types](https://docs.astral.sh/ty/features/type-system/#intersection-types), advanced [type narrowing](https://docs.astral.sh/ty/features/type-system/#top-and-bottom-materializations), and\n    [sophisticated reachability analysis](https://docs.astral.sh/ty/features/type-system/#reachability-based-on-types)\n\n## Getting started\n\nRun ty with [uvx](https://docs.astral.sh/uv/guides/tools/#running-tools) to get started quickly:\n\n```shell\nuvx ty check\n```\n\nOr, check out the [ty playground](https://play.ty.dev) to try it out in your browser.\n\nTo learn more about using ty, see the [documentation](https://docs.astral.sh/ty/).\n\n## Installation\n\nTo install ty, see the [installation](https://docs.astral.sh/ty/installation/) documentation.\n\nTo add the ty language server to your editor, see the [editor integration](https://docs.astral.sh/ty/editors/) guide.\n\n## Getting help\n\nIf you have questions or want to report a bug, please open an\n[issue](https://github.com/astral-sh/ty/issues) in this repository.\n\nYou may also join our [Discord server](https://discord.com/invite/astral-sh).\n\n## Contributing\n\nDevelopment of this project takes place in the [Ruff](https://github.com/astral-sh/ruff) repository\nat this time. Please [open pull requests](https://github.com/astral-sh/ruff/pulls) there for changes\nto anything in the `ruff` submodule (which includes all of the Rust source code).\n\nSee the\n[contributing guide](https://github.com/astral-sh/ty/blob/0.0.12/CONTRIBUTING.md) for more details.\n\n## FAQ\n\n<!-- We intentionally use smaller headings for the FAQ items -->\n\n<!-- markdownlint-disable MD001 -->\n\n#### Why is ty doing \\_\\_\\_\\_\\_?\n\nSee our [typing FAQ](https://docs.astral.sh/ty/reference/typing-faq).\n\n#### How do you pronounce ty?\n\nIt\'s pronounced as "tee - why" ([`/tiː waɪ/`](https://en.wikipedia.org/wiki/Help:IPA/English#Key))\n\n#### How should I stylize ty?\n\nJust "ty", please.\n\n<!-- markdownlint-enable MD001 -->\n\n## License\n\nty is licensed under the MIT license ([LICENSE](https://github.com/astral-sh/ty/blob/0.0.12/LICENSE) or\n<https://opensource.org/licenses/MIT>).\n\nUnless you explicitly state otherwise, any contribution intentionally submitted for inclusion in ty\nby you, as defined in the MIT license, shall be licensed as above, without any additional terms or\nconditions.\n\n<div align="center">\n  <a target="_blank" href="https://astral.sh" style="background:none">\n    <img src="https://raw.githubusercontent.com/astral-sh/uv/main/assets/svg/Astral.svg" alt="Made by Astral">\n  </a>\n</div>\n\n',
      home_page: "https://github.com/astral-sh/ty/",
      keywords: "ty,typing,analysis,check",
      license: "",
      metadata_version: "",
      name: "ty",
      platform: "",
      summary: "An extremely fast Python type checker, written in Rust.",
      version: "0.0.12",
      classifiers:
        '["Development Status :: 4 - Beta", "Environment :: Console", "Intended Audience :: Developers", "Operating System :: OS Independent", "License :: OSI Approved :: MIT License", "Programming Language :: Python", "Programming Language :: Python :: 3.8", "Programming Language :: Python :: 3.9", "Programming Language :: Python :: 3.10", "Programming Language :: Python :: 3.11", "Programming Language :: Python :: 3.12", "Programming Language :: Python :: 3.13", "Programming Language :: Python :: 3.14", "Programming Language :: Python :: 3 :: Only", "Programming Language :: Rust", "Topic :: Software Development :: Quality Assurance", "Topic :: Software Development :: Testing", "Topic :: Software Development :: Libraries", "Topic :: Software Development :: Libraries :: Python Modules"]',
      download_url: "",
      supported_platform: "",
      maintainer: "",
      maintainer_email: "",
      obsoletes_dist: "[]",
      project_url: "",
      project_urls:
        '["Changelog, https://github.com/astral-sh/ty/blob/main/CHANGELOG.md", "Discord, https://discord.gg/astral-sh", "Releases, https://github.com/astral-sh/ty/releases", "Repository, https://github.com/astral-sh/ty"]',
      provides_dist: "[]",
      requires_external: "[]",
      requires_dist: "null",
      requires_python: ">=3.8",
      description_content_type: "text/markdown; charset=UTF-8; variant=GFM",
      provides_extras: "null",
      dynamic: "null",
      license_expression: "",
      license_file: '["LICENSE"]',
      filename: "ty-0.0.12-2-py3-none-linux_ppc64le.whl",
      packagetype: "bdist_wheel",
      python_version: "py3",
      size: 10506196,
      sha256:
        "f0fbf762140c200138a0688de7437d827df5e6f88ed7dbbda3729c0d002a2350",
      metadata_sha256: undefined,
      provenance: undefined,
    },
    {
      pulp_href:
        "/api/pulp/calunga-ui-dev/api/v3/content/python/packages/019c2f07-ae17-71d4-9de4-5243c05cfc29/",
      prn: "prn:python.pythonpackagecontent:019c2f07-ae17-71d4-9de4-5243c05cfc29",
      pulp_created: "2026-02-05T18:19:26.122808Z",
      pulp_last_updated: "2026-02-05T18:19:26.122821Z",
      pulp_labels: {},
      vuln_report: undefined,
      artifact: undefined,
      author: "",
      author_email: "IPython Development Team <ipython-dev@python.org>",
      description:
        "# Traitlets\n\n[![Tests](https://github.com/ipython/traitlets/actions/workflows/tests.yml/badge.svg)](https://github.com/ipython/traitlets/actions/workflows/tests.yml)\n[![Documentation Status](https://readthedocs.org/projects/traitlets/badge/?version=latest)](https://traitlets.readthedocs.io/en/latest/?badge=latest)\n[![Tidelift](https://tidelift.com/subscription/pkg/pypi-traitlets)](https://tidelift.com/badges/package/pypi/traitlets)\n\n|               |                                      |\n| ------------- | ------------------------------------ |\n| **home**      | https://github.com/ipython/traitlets |\n| **pypi-repo** | https://pypi.org/project/traitlets/  |\n| **docs**      | https://traitlets.readthedocs.io/    |\n| **license**   | Modified BSD License                 |\n\nTraitlets is a pure Python library enabling:\n\n- the enforcement of strong typing for attributes of Python objects\n  (typed attributes are called _\"traits\"_);\n- dynamically calculated default values;\n- automatic validation and coercion of trait attributes when attempting a\n  change;\n- registering for receiving notifications when trait values change;\n- reading configuring values from files or from command line\n  arguments - a distinct layer on top of traitlets, so you may use\n  traitlets without the configuration machinery.\n\nIts implementation relies on the [descriptor](https://docs.python.org/howto/descriptor.html)\npattern, and it is a lightweight pure-python alternative of the\n[_traits_ library](https://docs.enthought.com/traits/).\n\nTraitlets powers the configuration system of IPython and Jupyter\nand the declarative API of IPython interactive widgets.\n\n## Installation\n\nFor a local installation, make sure you have\n[pip installed](https://pip.pypa.io/en/stable/installing/) and run:\n\n```bash\npip install traitlets\n```\n\nFor a **development installation**, clone this repository, change into the\n`traitlets` root directory, and run pip:\n\n```bash\ngit clone https://github.com/ipython/traitlets.git\ncd traitlets\npip install -e .\n```\n\n## Running the tests\n\n```bash\npip install \"traitlets[test]\"\npy.test traitlets\n```\n\n## Code Styling\n\n`traitlets` has adopted automatic code formatting so you shouldn't\nneed to worry too much about your code style.\nAs long as your code is valid,\nthe pre-commit hook should take care of how it should look.\n\nTo install `pre-commit` locally, run the following::\n\n```\npip install pre-commit\npre-commit install\n```\n\nYou can invoke the pre-commit hook by hand at any time with::\n\n```\npre-commit run\n```\n\nwhich should run any autoformatting on your code\nand tell you about any errors it couldn't fix automatically.\nYou may also install [black integration](https://github.com/psf/black#editor-integration)\ninto your text editor to format code automatically.\n\nIf you have already committed files before setting up the pre-commit\nhook with `pre-commit install`, you can fix everything up using\n`pre-commit run --all-files`. You need to make the fixing commit\nyourself after that.\n\nSome of the hooks only run on CI by default, but you can invoke them by\nrunning with the `--hook-stage manual` argument.\n\n## Usage\n\nAny class with trait attributes must inherit from `HasTraits`.\nFor the list of available trait types and their properties, see the\n[Trait Types](https://traitlets.readthedocs.io/en/latest/trait_types.html)\nsection of the documentation.\n\n### Dynamic default values\n\nTo calculate a default value dynamically, decorate a method of your class with\n`@default({traitname})`. This method will be called on the instance, and\nshould return the default value. In this example, the `_username_default`\nmethod is decorated with `@default('username')`:\n\n```Python\nimport getpass\nfrom traitlets import HasTraits, Unicode, default\n\nclass Identity(HasTraits):\n    username = Unicode()\n\n    @default('username')\n    def _username_default(self):\n        return getpass.getuser()\n```\n\n### Callbacks when a trait attribute changes\n\nWhen a trait changes, an application can follow this trait change with\nadditional actions.\n\nTo do something when a trait attribute is changed, decorate a method with\n[`traitlets.observe()`](https://traitlets.readthedocs.io/en/latest/api.html?highlight=observe#traitlets.observe).\nThe method will be called with a single argument, a dictionary which contains\nan owner, new value, old value, name of the changed trait, and the event type.\n\nIn this example, the `_num_changed` method is decorated with `` @observe(`num`) ``:\n\n```Python\nfrom traitlets import HasTraits, Integer, observe\n\nclass TraitletsExample(HasTraits):\n    num = Integer(5, help=\"a number\").tag(config=True)\n\n    @observe('num')\n    def _num_changed(self, change):\n        print(\"{name} changed from {old} to {new}\".format(**change))\n```\n\nand is passed the following dictionary when called:\n\n```Python\n{\n  'owner': object,  # The HasTraits instance\n  'new': 6,         # The new value\n  'old': 5,         # The old value\n  'name': \"foo\",    # The name of the changed trait\n  'type': 'change', # The event type of the notification, usually 'change'\n}\n```\n\n### Validation and coercion\n\nEach trait type (`Int`, `Unicode`, `Dict` etc.) may have its own validation or\ncoercion logic. In addition, we can register custom cross-validators\nthat may depend on the state of other attributes. For example:\n\n```Python\nfrom traitlets import HasTraits, TraitError, Int, Bool, validate\n\nclass Parity(HasTraits):\n    value = Int()\n    parity = Int()\n\n    @validate('value')\n    def _valid_value(self, proposal):\n        if proposal['value'] % 2 != self.parity:\n            raise TraitError('value and parity should be consistent')\n        return proposal['value']\n\n    @validate('parity')\n    def _valid_parity(self, proposal):\n        parity = proposal['value']\n        if parity not in [0, 1]:\n            raise TraitError('parity should be 0 or 1')\n        if self.value % 2 != parity:\n            raise TraitError('value and parity should be consistent')\n        return proposal['value']\n\nparity_check = Parity(value=2)\n\n# Changing required parity and value together while holding cross validation\nwith parity_check.hold_trait_notifications():\n    parity_check.value = 1\n    parity_check.parity = 1\n```\n\nHowever, we **recommend** that custom cross-validators don't modify the state\nof the HasTraits instance.\n\n## About the IPython Development Team\n\nThe IPython Development Team is the set of all contributors to the IPython project.\nThis includes all of the IPython subprojects.\n\nThe core team that coordinates development on GitHub can be found here:\nhttps://github.com/jupyter/.\n\n## Our Copyright Policy\n\nIPython uses a shared copyright model. Each contributor maintains copyright\nover their contributions to IPython. But, it is important to note that these\ncontributions are typically only changes to the repositories. Thus, the IPython\nsource code, in its entirety is not the copyright of any single person or\ninstitution. Instead, it is the collective copyright of the entire IPython\nDevelopment Team. If individual contributors want to maintain a record of what\nchanges/contributions they have specific copyright on, they should indicate\ntheir copyright in the commit message of the change, when they commit the\nchange to one of the IPython repositories.\n\nWith this in mind, the following banner should be used in any source code file\nto indicate the copyright and license terms:\n\n```\n# Copyright (c) IPython Development Team.\n# Distributed under the terms of the Modified BSD License.\n```\n",
      home_page: "",
      keywords: "Interactive,Interpreter,Shell,Web",
      license:
        'BSD 3-Clause License  - Copyright (c) 2001-, IPython Development Team  All rights reserved.  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:  1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.  2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.  3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.',
      metadata_version: "",
      name: "traitlets",
      platform: "",
      summary: "Traitlets Python configuration system",
      version: "5.14.3",
      classifiers:
        '["Framework :: IPython", "Framework :: Jupyter", "Intended Audience :: Developers", "Intended Audience :: Science/Research", "Intended Audience :: System Administrators", "License :: OSI Approved :: BSD License", "Programming Language :: Python", "Programming Language :: Python :: 3", "Typing :: Typed"]',
      download_url: "",
      supported_platform: "",
      maintainer: "",
      maintainer_email: "",
      obsoletes_dist: "[]",
      project_url: "",
      project_urls:
        '["Homepage, https://github.com/ipython/traitlets", "Documentation, https://traitlets.readthedocs.io", "Source, https://github.com/ipython/traitlets", "Funding, https://numfocus.org", "Tracker, https://github.com/ipython/traitlets/issues"]',
      provides_dist: "[]",
      requires_external: "[]",
      requires_dist:
        "[\"myst-parser; extra == 'docs'\", \"pydata-sphinx-theme; extra == 'docs'\", \"sphinx; extra == 'docs'\", \"argcomplete>=3.0.3; extra == 'test'\", \"mypy>=1.7.0; extra == 'test'\", \"pre-commit; extra == 'test'\", \"pytest-mock; extra == 'test'\", \"pytest-mypy-testing; extra == 'test'\", \"pytest<8.2,>=7.0; extra == 'test'\"]",
      requires_python: ">=3.8",
      description_content_type: "text/markdown",
      provides_extras: '["docs", "test"]',
      dynamic: "null",
      license_expression: "",
      license_file: '["LICENSE"]',
      filename: "traitlets-5.14.3-2-py3-none-any.whl",
      packagetype: "bdist_wheel",
      python_version: "py3",
      size: 86284,
      sha256:
        "f03ac083190b124ca15ecffc83f23a522a7ec5d900a4fc9235c022a1a8fa00c2",
      metadata_sha256: undefined,
      provenance: undefined,
    },
    {
      pulp_href:
        "/api/pulp/calunga-ui-dev/api/v3/content/python/packages/019c2f07-9f59-74b5-9c08-6335ec107275/",
      prn: "prn:python.pythonpackagecontent:019c2f07-9f59-74b5-9c08-6335ec107275",
      pulp_created: "2026-02-05T18:19:26.114045Z",
      pulp_last_updated: "2026-02-05T18:19:26.114060Z",
      pulp_labels: {},
      vuln_report: undefined,
      artifact: undefined,
      author: "Tzu-ping Chung",
      author_email: "uranusjr@gmail.com",
      description:
        "=============================================\nShellingham: Tool to Detect Surrounding Shell\n=============================================\n\n.. image:: https://img.shields.io/pypi/v/shellingham.svg\n    :target: https://pypi.org/project/shellingham/\n\nShellingham detects what shell the current Python executable is running in.\n\n\nUsage\n=====\n\n.. code-block:: python\n\n    >>> import shellingham\n    >>> shellingham.detect_shell()\n    ('bash', '/bin/bash')\n\n``detect_shell`` pokes around the process's running environment to determine\nwhat shell it is run in. It returns a 2-tuple:\n\n* The shell name, always lowercased.\n* The command used to run the shell.\n\n``ShellDetectionFailure`` is raised if ``detect_shell`` fails to detect the\nsurrounding shell.\n\n\nNotes\n=====\n\n* The shell name is always lowercased.\n* On Windows, the shell name is the name of the executable, minus the file\n  extension.\n\n\nNotes for Application Developers\n================================\n\nRemember, your application's user is not necessarily using a shell.\nShellingham raises ``ShellDetectionFailure`` if there is no shell to detect,\nbut *your application should almost never do this to your user*.\n\nA practical approach to this is to wrap ``detect_shell`` in a try block, and\nprovide a sane default on failure\n\n.. code-block:: python\n\n    try:\n        shell = shellingham.detect_shell()\n    except shellingham.ShellDetectionFailure:\n        shell = provide_default()\n\n\nThere are a few choices for you to choose from.\n\n* The POSIX standard mandates the environment variable ``SHELL`` to refer to\n  \"the user's preferred command language interpreter\". This is always available\n  (even if the user is not in an interactive session), and likely the correct\n  choice to launch an interactive sub-shell with.\n* A command ``sh`` is almost guaranteed to exist, likely at ``/bin/sh``, since\n  several POSIX tools rely on it. This should be suitable if you want to run a\n  (possibly non-interactive) script.\n* All versions of DOS and Windows have an environment variable ``COMSPEC``.\n  This can always be used to launch a usable command prompt (e.g. `cmd.exe` on\n  Windows).\n\nHere's a simple implementation to provide a default shell\n\n.. code-block:: python\n\n    import os\n\n    def provide_default():\n        if os.name == 'posix':\n            return os.environ['SHELL']\n        elif os.name == 'nt':\n            return os.environ['COMSPEC']\n        raise NotImplementedError(f'OS {os.name!r} support not available')\n",
      home_page: "https://github.com/sarugaku/shellingham",
      keywords: "shell",
      license: "ISC License",
      metadata_version: "",
      name: "shellingham",
      platform: "",
      summary: "Tool to Detect Surrounding Shell",
      version: "1.5.4",
      classifiers:
        '["Development Status :: 3 - Alpha", "Environment :: Console", "Intended Audience :: Developers", "License :: OSI Approved :: ISC License (ISCL)", "Operating System :: OS Independent", "Programming Language :: Python :: 3 :: Only", "Programming Language :: Python :: 3.7", "Programming Language :: Python :: 3.8", "Programming Language :: Python :: 3.9", "Programming Language :: Python :: 3.10", "Programming Language :: Python :: 3.11", "Programming Language :: Python :: 3.12", "Topic :: Software Development :: Libraries :: Python Modules"]',
      download_url: "",
      supported_platform: "",
      maintainer: "",
      maintainer_email: "",
      obsoletes_dist: "[]",
      project_url: "",
      project_urls: "null",
      provides_dist: "[]",
      requires_external: "[]",
      requires_dist: "null",
      requires_python: ">=3.7",
      description_content_type: "text/x-rst",
      provides_extras: "null",
      dynamic: '["license-file"]',
      license_expression: "",
      license_file: '["LICENSE"]',
      filename: "shellingham-1.5.4-2-py2.py3-none-any.whl",
      packagetype: "bdist_wheel",
      python_version: "py2.py3",
      size: 10756,
      sha256:
        "ea71831f51709ba442a358f3ddb2c0c233063d2bc7bd7bf47f9e785f9b7cbb62",
      metadata_sha256: undefined,
      provenance: undefined,
    },
    {
      pulp_href:
        "/api/pulp/calunga-ui-dev/api/v3/content/python/packages/019c2f07-a554-7937-b3dc-61df85159f84/",
      prn: "prn:python.pythonpackagecontent:019c2f07-a554-7937-b3dc-61df85159f84",
      pulp_created: "2026-02-05T18:19:26.105342Z",
      pulp_last_updated: "2026-02-05T18:19:26.105355Z",
      pulp_labels: {},
      vuln_report: undefined,
      artifact: undefined,
      author: "",
      author_email: "Tom Christie <tom@tomchristie.com>",
      description:
        '<p align="center">\n  <picture>\n    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Kludex/starlette/main/docs/img/starlette_dark.svg" width="420px">\n    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/Kludex/starlette/main/docs/img/starlette.svg" width="420px">\n    <img alt="starlette-logo" src="https://raw.githubusercontent.com/Kludex/starlette/main/docs/img/starlette_dark.svg">\n  </picture>\n</p>\n\n<p align="center">\n    <em>✨ The little ASGI framework that shines. ✨</em>\n</p>\n\n---\n\n[![Build Status](https://github.com/Kludex/starlette/workflows/Test%20Suite/badge.svg)](https://github.com/Kludex/starlette/actions)\n[![Package version](https://badge.fury.io/py/starlette.svg)](https://pypi.python.org/pypi/starlette)\n[![Supported Python Version](https://img.shields.io/pypi/pyversions/starlette.svg?color=%2334D058)](https://pypi.org/project/starlette)\n[![Discord](https://img.shields.io/discord/1051468649518616576?logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/RxKUF5JuHs)\n\n---\n\n**Documentation**: <a href="https://starlette.dev/" target="_blank">https://starlette.dev</a>\n\n**Source Code**: <a href="https://github.com/Kludex/starlette" target="_blank">https://github.com/Kludex/starlette</a>\n\n---\n\n# Starlette\n\nStarlette is a lightweight [ASGI][asgi] framework/toolkit,\nwhich is ideal for building async web services in Python.\n\nIt is production-ready, and gives you the following:\n\n* A lightweight, low-complexity HTTP web framework.\n* WebSocket support.\n* In-process background tasks.\n* Startup and shutdown events.\n* Test client built on `httpx`.\n* CORS, GZip, Static Files, Streaming responses.\n* Session and Cookie support.\n* 100% test coverage.\n* 100% type annotated codebase.\n* Few hard dependencies.\n* Compatible with `asyncio` and `trio` backends.\n* Great overall performance [against independent benchmarks][techempower].\n\n## Installation\n\n```shell\n$ pip install starlette\n```\n\nYou\'ll also want to install an ASGI server, such as [uvicorn](https://www.uvicorn.org/), [daphne](https://github.com/django/daphne/), or [hypercorn](https://hypercorn.readthedocs.io/en/latest/).\n\n```shell\n$ pip install uvicorn\n```\n\n## Example\n\n```python title="main.py"\nfrom starlette.applications import Starlette\nfrom starlette.responses import JSONResponse\nfrom starlette.routing import Route\n\n\nasync def homepage(request):\n    return JSONResponse({\'hello\': \'world\'})\n\nroutes = [\n    Route("/", endpoint=homepage)\n]\n\napp = Starlette(debug=True, routes=routes)\n```\n\nThen run the application using Uvicorn:\n\n```shell\n$ uvicorn main:app\n```\n\n## Dependencies\n\nStarlette only requires `anyio`, and the following are optional:\n\n* [`httpx`][httpx] - Required if you want to use the `TestClient`.\n* [`jinja2`][jinja2] - Required if you want to use `Jinja2Templates`.\n* [`python-multipart`][python-multipart] - Required if you want to support form parsing, with `request.form()`.\n* [`itsdangerous`][itsdangerous] - Required for `SessionMiddleware` support.\n* [`pyyaml`][pyyaml] - Required for `SchemaGenerator` support.\n\nYou can install all of these with `pip install starlette[full]`.\n\n## Framework or Toolkit\n\nStarlette is designed to be used either as a complete framework, or as\nan ASGI toolkit. You can use any of its components independently.\n\n```python\nfrom starlette.responses import PlainTextResponse\n\n\nasync def app(scope, receive, send):\n    assert scope[\'type\'] == \'http\'\n    response = PlainTextResponse(\'Hello, world!\')\n    await response(scope, receive, send)\n```\n\nRun the `app` application in `example.py`:\n\n```shell\n$ uvicorn example:app\nINFO: Started server process [11509]\nINFO: Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)\n```\n\nRun uvicorn with `--reload` to enable auto-reloading on code changes.\n\n## Modularity\n\nThe modularity that Starlette is designed on promotes building re-usable\ncomponents that can be shared between any ASGI framework. This should enable\nan ecosystem of shared middleware and mountable applications.\n\nThe clean API separation also means it\'s easier to understand each component\nin isolation.\n\n---\n\n<p align="center"><i>Starlette is <a href="https://github.com/Kludex/starlette/blob/main/LICENSE.md">BSD licensed</a> code.<br/>Designed & crafted with care.</i></br>&mdash; ⭐️ &mdash;</p>\n\n[asgi]: https://asgi.readthedocs.io/en/latest/\n[httpx]: https://www.python-httpx.org/\n[jinja2]: https://jinja.palletsprojects.com/\n[python-multipart]: https://multipart.fastapiexpert.com/\n[itsdangerous]: https://itsdangerous.palletsprojects.com/\n[sqlalchemy]: https://www.sqlalchemy.org\n[pyyaml]: https://pyyaml.org/wiki/PyYAMLDocumentation\n[techempower]: https://www.techempower.com/benchmarks/#hw=ph&test=fortune&l=zijzen-sf\n',
      home_page: "",
      keywords: "",
      license: "",
      metadata_version: "",
      name: "starlette",
      platform: "",
      summary: "The little ASGI library that shines.",
      version: "0.50.0",
      classifiers:
        '["Development Status :: 3 - Alpha", "Environment :: Web Environment", "Framework :: AnyIO", "Intended Audience :: Developers", "Operating System :: OS Independent", "Programming Language :: Python :: 3", "Programming Language :: Python :: 3.10", "Programming Language :: Python :: 3.11", "Programming Language :: Python :: 3.12", "Programming Language :: Python :: 3.13", "Programming Language :: Python :: 3.14", "Topic :: Internet :: WWW/HTTP"]',
      download_url: "",
      supported_platform: "",
      maintainer: "",
      maintainer_email: "Marcelo Trylesinski <marcelotryle@gmail.com>",
      obsoletes_dist: "[]",
      project_url: "",
      project_urls:
        '["Homepage, https://github.com/Kludex/starlette", "Documentation, https://starlette.dev/", "Changelog, https://starlette.dev/release-notes/", "Funding, https://github.com/sponsors/Kludex", "Source, https://github.com/Kludex/starlette"]',
      provides_dist: "[]",
      requires_external: "[]",
      requires_dist:
        '["anyio<5,>=3.6.2", "typing-extensions>=4.10.0; python_version < \'3.13\'", "httpx<0.29.0,>=0.27.0; extra == \'full\'", "itsdangerous; extra == \'full\'", "jinja2; extra == \'full\'", "python-multipart>=0.0.18; extra == \'full\'", "pyyaml; extra == \'full\'"]',
      requires_python: ">=3.10",
      description_content_type: "text/markdown",
      provides_extras: '["full"]',
      dynamic: "null",
      license_expression: "BSD-3-Clause",
      license_file: '["LICENSE.md"]',
      filename: "starlette-0.50.0-2-py3-none-any.whl",
      packagetype: "bdist_wheel",
      python_version: "py3",
      size: 74954,
      sha256:
        "e71fee786f4d72e3ca8c7bedd5486d80ec1edb32d821e1824222c5cee0de109c",
      metadata_sha256: undefined,
      provenance: undefined,
    },
    {
      pulp_href:
        "/api/pulp/calunga-ui-dev/api/v3/content/python/packages/019c2f07-b793-7560-bf71-855961ffa536/",
      prn: "prn:python.pythonpackagecontent:019c2f07-b793-7560-bf71-855961ffa536",
      pulp_created: "2026-02-05T18:19:26.096464Z",
      pulp_last_updated: "2026-02-05T18:19:26.096477Z",
      pulp_labels: {},
      vuln_report: undefined,
      artifact: undefined,
      author: "",
      author_email: "Andrey Petrov <andrey.petrov@shazow.net>",
      description:
        '<h1 align="center">\n\n![urllib3](https://github.com/urllib3/urllib3/raw/main/docs/_static/banner_github.svg)\n\n</h1>\n\n<p align="center">\n  <a href="https://pypi.org/project/urllib3"><img alt="PyPI Version" src="https://img.shields.io/pypi/v/urllib3.svg?maxAge=86400" /></a>\n  <a href="https://pypi.org/project/urllib3"><img alt="Python Versions" src="https://img.shields.io/pypi/pyversions/urllib3.svg?maxAge=86400" /></a>\n  <a href="https://discord.gg/urllib3"><img alt="Join our Discord" src="https://img.shields.io/discord/756342717725933608?color=%237289da&label=discord" /></a>\n  <a href="https://github.com/urllib3/urllib3/actions?query=workflow%3ACI"><img alt="Coverage Status" src="https://img.shields.io/badge/coverage-100%25-success" /></a>\n  <a href="https://github.com/urllib3/urllib3/actions/workflows/ci.yml?query=branch%3Amain"><img alt="Build Status on GitHub" src="https://github.com/urllib3/urllib3/actions/workflows/ci.yml/badge.svg?branch:main&workflow:CI" /></a>\n  <a href="https://urllib3.readthedocs.io"><img alt="Documentation Status" src="https://readthedocs.org/projects/urllib3/badge/?version=latest" /></a><br>\n  <a href="https://deps.dev/pypi/urllib3"><img alt="OpenSSF Scorecard" src="https://api.securityscorecards.dev/projects/github.com/urllib3/urllib3/badge" /></a>\n  <a href="https://slsa.dev"><img alt="SLSA 3" src="https://slsa.dev/images/gh-badge-level3.svg" /></a>\n  <a href="https://bestpractices.coreinfrastructure.org/projects/6227"><img alt="CII Best Practices" src="https://bestpractices.coreinfrastructure.org/projects/6227/badge" /></a>\n</p>\n\nurllib3 is a powerful, *user-friendly* HTTP client for Python.\nurllib3 brings many critical features that are missing from the Python\nstandard libraries:\n\n- Thread safety.\n- Connection pooling.\n- Client-side SSL/TLS verification.\n- File uploads with multipart encoding.\n- Helpers for retrying requests and dealing with HTTP redirects.\n- Support for gzip, deflate, brotli, and zstd encoding.\n- Proxy support for HTTP and SOCKS.\n- 100% test coverage.\n\n... and many more features, but most importantly: Our maintainers have a 15+\nyear track record of maintaining urllib3 with the highest code standards and\nattention to security and safety.\n\n[Much of the Python ecosystem already uses urllib3](https://urllib3.readthedocs.io/en/stable/#who-uses)\nand you should too.\n\n\n## Installing\n\nurllib3 can be installed with [pip](https://pip.pypa.io):\n\n```bash\n$ python -m pip install urllib3\n```\n\nAlternatively, you can grab the latest source code from [GitHub](https://github.com/urllib3/urllib3):\n\n```bash\n$ git clone https://github.com/urllib3/urllib3.git\n$ cd urllib3\n$ pip install .\n```\n\n## Getting Started\n\nurllib3 is easy to use:\n\n```python3\n>>> import urllib3\n>>> resp = urllib3.request("GET", "http://httpbin.org/robots.txt")\n>>> resp.status\n200\n>>> resp.data\nb"User-agent: *\\nDisallow: /deny\\n"\n```\n\nurllib3 has usage and reference documentation at [urllib3.readthedocs.io](https://urllib3.readthedocs.io).\n\n\n## Community\n\nurllib3 has a [community Discord channel](https://discord.gg/urllib3) for asking questions and\ncollaborating with other contributors. Drop by and say hello 👋\n\n\n## Contributing\n\nurllib3 happily accepts contributions. Please see our\n[contributing documentation](https://urllib3.readthedocs.io/en/latest/contributing.html)\nfor some tips on getting started.\n\n\n## Security Disclosures\n\nTo report a security vulnerability, please use the\n[Tidelift security contact](https://tidelift.com/security).\nTidelift will coordinate the fix and disclosure with maintainers.\n\n\n## Maintainers\n\nMeet our maintainers since 2008:\n\n- Current Lead: [@illia-v](https://github.com/illia-v) (Illia Volochii)\n- [@sethmlarson](https://github.com/sethmlarson) (Seth M. Larson)\n- [@pquentin](https://github.com/pquentin) (Quentin Pradet)\n- [@theacodes](https://github.com/theacodes) (Thea Flowers)\n- [@haikuginger](https://github.com/haikuginger) (Jess Shapiro)\n- [@lukasa](https://github.com/lukasa) (Cory Benfield)\n- [@sigmavirus24](https://github.com/sigmavirus24) (Ian Stapleton Cordasco)\n- [@shazow](https://github.com/shazow) (Andrey Petrov)\n\n👋\n\n\n## Sponsorship\n\nIf your company benefits from this library, please consider [sponsoring its\ndevelopment](https://urllib3.readthedocs.io/en/latest/sponsors.html).\n\n\n## For Enterprise\n\nProfessional support for urllib3 is available as part of the [Tidelift\nSubscription][1]. Tidelift gives software development teams a single source for\npurchasing and maintaining their software, with professional grade assurances\nfrom the experts who know it best, while seamlessly integrating with existing\ntools.\n\n[1]: https://tidelift.com/subscription/pkg/pypi-urllib3?utm_source=pypi-urllib3&utm_medium=referral&utm_campaign=readme\n',
      home_page: "",
      keywords: "filepost,http,httplib,https,pooling,ssl,threadsafe,urllib",
      license: "",
      metadata_version: "",
      name: "urllib3",
      platform: "",
      summary:
        "HTTP library with thread-safe connection pooling, file post, and more.",
      version: "2.6.3",
      classifiers:
        '["Environment :: Web Environment", "Intended Audience :: Developers", "Operating System :: OS Independent", "Programming Language :: Python", "Programming Language :: Python :: 3", "Programming Language :: Python :: 3 :: Only", "Programming Language :: Python :: 3.9", "Programming Language :: Python :: 3.10", "Programming Language :: Python :: 3.11", "Programming Language :: Python :: 3.12", "Programming Language :: Python :: 3.13", "Programming Language :: Python :: 3.14", "Programming Language :: Python :: Free Threading :: 2 - Beta", "Programming Language :: Python :: Implementation :: CPython", "Programming Language :: Python :: Implementation :: PyPy", "Topic :: Internet :: WWW/HTTP", "Topic :: Software Development :: Libraries"]',
      download_url: "",
      supported_platform: "",
      maintainer: "",
      maintainer_email:
        "Seth Michael Larson <sethmichaellarson@gmail.com>, Quentin Pradet <quentin@pradet.me>, Illia Volochii <illia.volochii@gmail.com>",
      obsoletes_dist: "[]",
      project_url: "",
      project_urls:
        '["Changelog, https://github.com/urllib3/urllib3/blob/main/CHANGES.rst", "Documentation, https://urllib3.readthedocs.io", "Code, https://github.com/urllib3/urllib3", "Issue tracker, https://github.com/urllib3/urllib3/issues"]',
      provides_dist: "[]",
      requires_external: "[]",
      requires_dist:
        "[\"brotli>=1.2.0; (platform_python_implementation == 'CPython') and extra == 'brotli'\", \"brotlicffi>=1.2.0.0; (platform_python_implementation != 'CPython') and extra == 'brotli'\", \"h2<5,>=4; extra == 'h2'\", \"pysocks!=1.5.7,<2.0,>=1.5.6; extra == 'socks'\", \"backports-zstd>=1.0.0; (python_version < '3.14') and extra == 'zstd'\"]",
      requires_python: ">=3.9",
      description_content_type: "text/markdown",
      provides_extras: '["brotli", "h2", "socks", "zstd"]',
      dynamic: "null",
      license_expression: "MIT",
      license_file: '["LICENSE.txt"]',
      filename: "urllib3-2.6.3-2-py3-none-any.whl",
      packagetype: "bdist_wheel",
      python_version: "py3",
      size: 132528,
      sha256:
        "dc2dad364cd0f22463c6f47e545188c3dc575c1eb6e04f3145223f8671ebf23f",
      metadata_sha256: undefined,
      provenance: undefined,
    },
    {
      pulp_href:
        "/api/pulp/calunga-ui-dev/api/v3/content/python/packages/019c2f07-c17c-7d26-a6ed-e26ea99bed9c/",
      prn: "prn:python.pythonpackagecontent:019c2f07-c17c-7d26-a6ed-e26ea99bed9c",
      pulp_created: "2026-02-05T18:19:26.087486Z",
      pulp_last_updated: "2026-02-05T18:19:26.087499Z",
      pulp_labels: {},
      vuln_report: undefined,
      artifact: undefined,
      author: "Yue Du",
      author_email: "ifduyue@gmail.com",
      description:
        "python-xxhash\n=============\n\n.. image:: https://github.com/ifduyue/python-xxhash/actions/workflows/test.yml/badge.svg\n    :target: https://github.com/ifduyue/python-xxhash/actions/workflows/test.yml\n    :alt: Github Actions Status\n\n.. image:: https://img.shields.io/pypi/v/xxhash.svg\n    :target: https://pypi.org/project/xxhash/\n    :alt: Latest Version\n\n.. image:: https://img.shields.io/pypi/pyversions/xxhash.svg\n    :target: https://pypi.org/project/xxhash/\n    :alt: Supported Python versions\n\n.. image:: https://img.shields.io/pypi/l/xxhash.svg\n    :target: https://pypi.org/project/xxhash/\n    :alt: License\n\n\n.. _HMAC: http://en.wikipedia.org/wiki/Hash-based_message_authentication_code\n.. _xxHash: https://github.com/Cyan4973/xxHash\n.. _Cyan4973: https://github.com/Cyan4973\n\n\nxxhash is a Python binding for the xxHash_ library by `Yann Collet`__.\n\n__ Cyan4973_\n\nInstallation\n------------\n\n.. code-block:: bash\n\n   $ pip install xxhash\n   \nYou can also install using conda:\n\n.. code-block:: bash\n\n   $ conda install -c conda-forge python-xxhash\n\n\nInstalling From Source\n~~~~~~~~~~~~~~~~~~~~~~~\n\n.. code-block:: bash\n\n   $ pip install --no-binary xxhash xxhash\n\nPrerequisites\n++++++++++++++\n\nOn Debian/Ubuntu:\n\n.. code-block:: bash\n\n   $ apt-get install python-dev gcc\n\nOn CentOS/Fedora:\n\n.. code-block:: bash\n\n   $ yum install python-devel gcc redhat-rpm-config\n\nLinking to libxxhash.so\n~~~~~~~~~~~~~~~~~~~~~~~~\n\nBy default python-xxhash will use bundled xxHash,\nwe can change this by specifying ENV var ``XXHASH_LINK_SO``:\n\n.. code-block:: bash\n\n   $ XXHASH_LINK_SO=1 pip install --no-binary xxhash xxhash\n\nUsage\n--------\n\nModule version and its backend xxHash library version can be retrieved using\nthe module properties ``VERSION`` AND ``XXHASH_VERSION`` respectively.\n\n.. code-block:: python\n\n    >>> import xxhash\n    >>> xxhash.VERSION\n    '2.0.0'\n    >>> xxhash.XXHASH_VERSION\n    '0.8.0'\n\nThis module is hashlib-compliant, which means you can use it in the same way as ``hashlib.md5``.\n\n    | update() -- update the current digest with an additional string\n    | digest() -- return the current digest value\n    | hexdigest() -- return the current digest as a string of hexadecimal digits\n    | intdigest() -- return the current digest as an integer\n    | copy() -- return a copy of the current xxhash object\n    | reset() -- reset state\n\nmd5 digest returns bytes, but the original xxh32 and xxh64 C APIs return integers.\nWhile this module is made hashlib-compliant, ``intdigest()`` is also provided to\nget the integer digest.\n\nConstructors for hash algorithms provided by this module are ``xxh32()`` and ``xxh64()``.\n\nFor example, to obtain the digest of the byte string ``b'Nobody inspects the spammish repetition'``:\n\n.. code-block:: python\n\n    >>> import xxhash\n    >>> x = xxhash.xxh32()\n    >>> x.update(b'Nobody inspects')\n    >>> x.update(b' the spammish repetition')\n    >>> x.digest()\n    b'\\xe2);/'\n    >>> x.digest_size\n    4\n    >>> x.block_size\n    16\n\nMore condensed:\n\n.. code-block:: python\n\n    >>> xxhash.xxh32(b'Nobody inspects the spammish repetition').hexdigest()\n    'e2293b2f'\n    >>> xxhash.xxh32(b'Nobody inspects the spammish repetition').digest() == x.digest()\n    True\n\nAn optional seed (default is 0) can be used to alter the result predictably:\n\n.. code-block:: python\n\n    >>> import xxhash\n    >>> xxhash.xxh64('xxhash').hexdigest()\n    '32dd38952c4bc720'\n    >>> xxhash.xxh64('xxhash', seed=20141025).hexdigest()\n    'b559b98d844e0635'\n    >>> x = xxhash.xxh64(seed=20141025)\n    >>> x.update('xxhash')\n    >>> x.hexdigest()\n    'b559b98d844e0635'\n    >>> x.intdigest()\n    13067679811253438005\n\nBe careful that xxh32 takes an unsigned 32-bit integer as seed, while xxh64\ntakes an unsigned 64-bit integer. Although unsigned integer overflow is\ndefined behavior, it's better not to make it happen:\n\n.. code-block:: python\n\n    >>> xxhash.xxh32('I want an unsigned 32-bit seed!', seed=0).hexdigest()\n    'f7a35af8'\n    >>> xxhash.xxh32('I want an unsigned 32-bit seed!', seed=2**32).hexdigest()\n    'f7a35af8'\n    >>> xxhash.xxh32('I want an unsigned 32-bit seed!', seed=1).hexdigest()\n    'd8d4b4ba'\n    >>> xxhash.xxh32('I want an unsigned 32-bit seed!', seed=2**32+1).hexdigest()\n    'd8d4b4ba'\n    >>>\n    >>> xxhash.xxh64('I want an unsigned 64-bit seed!', seed=0).hexdigest()\n    'd4cb0a70a2b8c7c1'\n    >>> xxhash.xxh64('I want an unsigned 64-bit seed!', seed=2**64).hexdigest()\n    'd4cb0a70a2b8c7c1'\n    >>> xxhash.xxh64('I want an unsigned 64-bit seed!', seed=1).hexdigest()\n    'ce5087f12470d961'\n    >>> xxhash.xxh64('I want an unsigned 64-bit seed!', seed=2**64+1).hexdigest()\n    'ce5087f12470d961'\n\n\n``digest()`` returns bytes of the **big-endian** representation of the integer\ndigest:\n\n.. code-block:: python\n\n    >>> import xxhash\n    >>> h = xxhash.xxh64()\n    >>> h.digest()\n    b'\\xefF\\xdb7Q\\xd8\\xe9\\x99'\n    >>> h.intdigest().to_bytes(8, 'big')\n    b'\\xefF\\xdb7Q\\xd8\\xe9\\x99'\n    >>> h.hexdigest()\n    'ef46db3751d8e999'\n    >>> format(h.intdigest(), '016x')\n    'ef46db3751d8e999'\n    >>> h.intdigest()\n    17241709254077376921\n    >>> int(h.hexdigest(), 16)\n    17241709254077376921\n\nBesides xxh32/xxh64 mentioned above, oneshot functions are also provided,\nso we can avoid allocating XXH32/64 state on heap:\n\n    | xxh32_digest(bytes, seed=0)\n    | xxh32_intdigest(bytes, seed=0)\n    | xxh32_hexdigest(bytes, seed=0)\n    | xxh64_digest(bytes, seed=0)\n    | xxh64_intdigest(bytes, seed=0)\n    | xxh64_hexdigest(bytes, seed=0)\n\n.. code-block:: python\n\n    >>> import xxhash\n    >>> xxhash.xxh64('a').digest() == xxhash.xxh64_digest('a')\n    True\n    >>> xxhash.xxh64('a').intdigest() == xxhash.xxh64_intdigest('a')\n    True\n    >>> xxhash.xxh64('a').hexdigest() == xxhash.xxh64_hexdigest('a')\n    True\n    >>> xxhash.xxh64_hexdigest('xxhash', seed=20141025)\n    'b559b98d844e0635'\n    >>> xxhash.xxh64_intdigest('xxhash', seed=20141025)\n    13067679811253438005L\n    >>> xxhash.xxh64_digest('xxhash', seed=20141025)\n    '\\xb5Y\\xb9\\x8d\\x84N\\x065'\n\n.. code-block:: python\n\n    In [1]: import xxhash\n\n    In [2]: %timeit xxhash.xxh64_hexdigest('xxhash')\n    268 ns ± 24.1 ns per loop (mean ± std. dev. of 7 runs, 1000000 loops each)\n\n    In [3]: %timeit xxhash.xxh64('xxhash').hexdigest()\n    416 ns ± 17.3 ns per loop (mean ± std. dev. of 7 runs, 1000000 loops each)\n\n\nXXH3 hashes are available since v2.0.0 (xxHash v0.8.0), they are:\n\nStreaming classes:\n\n    | xxh3_64\n    | xxh3_128\n\nOneshot functions:\n\n    | xxh3_64_digest(bytes, seed=0)\n    | xxh3_64_intdigest(bytes, seed=0)\n    | xxh3_64_hexdigest(bytes, seed=0)\n    | xxh3_128_digest(bytes, seed=0)\n    | xxh3_128_intdigest(bytes, seed=0)\n    | xxh3_128_hexdigest(bytes, seed=0)\n\nAnd aliases:\n\n    | xxh128 = xxh3_128\n    | xxh128_digest = xxh3_128_digest\n    | xxh128_intdigest = xxh3_128_intdigest\n    | xxh128_hexdigest = xxh3_128_hexdigest\n\nCaveats\n-------\n\nSEED OVERFLOW\n~~~~~~~~~~~~~~\n\nxxh32 takes an unsigned 32-bit integer as seed, and xxh64 takes\nan unsigned 64-bit integer as seed. Make sure that the seed is greater than\nor equal to ``0``.\n\nENDIANNESS\n~~~~~~~~~~~\n\nAs of python-xxhash 0.3.0, ``digest()`` returns bytes of the\n**big-endian** representation of the integer digest. It used\nto be little-endian.\n\nDONT USE XXHASH IN HMAC\n~~~~~~~~~~~~~~~~~~~~~~~\nThough you can use xxhash as an HMAC_ hash function, but it's\nhighly recommended not to.\n\nxxhash is **NOT** a cryptographic hash function, it is a\nnon-cryptographic hash algorithm aimed at speed and quality.\nDo not put xxhash in any position where cryptographic hash\nfunctions are required.\n\n\nCopyright and License\n---------------------\n\nCopyright (c) 2014-2025 Yue Du - https://github.com/ifduyue\n\nLicensed under `BSD 2-Clause License <http://opensource.org/licenses/BSD-2-Clause>`_\n\nCHANGELOG\n-----------\n\nv3.6.0 2025-10-02\n~~~~~~~~~~~~~~~~~\n\n- Build wheels for Python 3.14\n- Python free-threading support\n- Typing: Use Buffer type stubs\n- Deprecate xxhash.VERSION_TUPLE, it will be removed in the next major release\n\nv3.5.0 2024-08-17\n~~~~~~~~~~~~~~~~~\n\n- Build wheels for Python 3.13\n\nv3.4.1 2023-10-05\n~~~~~~~~~~~~~~~~~\n\n- Build wheels for Python 3.12\n- Remove setuptools_scm\n\nv3.4.0 2023-10-05\n~~~~~~~~~~~~~~~~~\n\n*Yanked* due to wheels building problem.\n\nv3.3.0 2023-07-29\n~~~~~~~~~~~~~~~~~\n\n- Upgrade xxHash to v0.8.2\n- Drop support for Python 3.6\n\nv3.2.0 2022-12-28\n~~~~~~~~~~~~~~~~~\n\nThis is the last version to support Python 3.6\n\n- Build Python 3.11 wheels.\n- Remove setup.py test_suites, call unittest directly\n\nv3.1.0 2022-10-19\n~~~~~~~~~~~~~~~~~\n\n- Type annotations.\n- Enabled muslinux wheels building.\n\nv3.0.0 2022-02-25\n~~~~~~~~~~~~~~~~~\n\n- New set `algorithms_available` lists all implemented algorithms in `xxhash`\n  package.\n- Upgrade xxHash to v0.8.1.\n- Drop support for EOL Python versions, require python >= 3.6 from now on.\n- Migrate to github actions and build arm64 wheels for macOS.\n- Always release GIL.\n\n\nv2.0.2 2021-04-15\n~~~~~~~~~~~~~~~~~\n\n- Fix Travis CI OSX dpl python2.7 get-pip.py error\n\nv2.0.1 2021-04-15\n~~~~~~~~~~~~~~~~~\n\n- Only to trigger Python 3.9 wheels building.\n\nv2.0.0 2020-08-03\n~~~~~~~~~~~~~~~~~\n\n- **Require xxHash version >= v0.8.0**\n- Upgrade xxHash to v0.8.0\n- XXH3 hashes: `xxh3_64`, `xxh3_128`, and their oneshot functions\n\nv1.4.4 2020-06-20\n~~~~~~~~~~~~~~~~~\n\n- Upgrade xxHash to v0.7.3\n- Stop using PEP393 deprecated APIs\n- Use XXH(32|64)_canonicalFromHash to replace u2bytes and ull2bytes\n\nv1.4.3 2019-11-12\n~~~~~~~~~~~~~~~~~\n\n- Upgrade xxHash to v0.7.2\n- Python 3.8 wheels\n\nv1.4.2 2019-10-13\n~~~~~~~~~~~~~~~~~\n\n- Fixed: setup.py fails when reading README.rst and the default encoding is not UTF-8\n\nv1.4.1 2019-08-27\n~~~~~~~~~~~~~~~~~\n\n- Fixed: xxh3.h in missing from source tarball\n\nv1.4.0 2019-08-25\n~~~~~~~~~~~~~~~~~\n\n- Upgrade xxHash to v0.7.1\n\nv1.3.0 2018-10-21\n~~~~~~~~~~~~~~~~~\n\n- Wheels are now built automatically\n- Split CFFI variant into a separate package `ifduyue/python-xxhash-cffi <https://github.com/ifduyue/python-xxhash-cffi>`_\n\nv1.2.0 2018-07-13\n~~~~~~~~~~~~~~~~~\n\n- Add oneshot functions xxh{32,64}_{,int,hex}digest\n\nv1.1.0 2018-07-05\n~~~~~~~~~~~~~~~~~\n\n- Allow input larger than 2GB\n- Release the GIL on sufficiently large input\n- Drop support for Python 3.2\n\nv1.0.1 2017-03-02\n~~~~~~~~~~~~~~~~~~\n\n- Free state actively, instead of delegating it to ffi.gc\n\nv1.0.0 2017-02-10\n~~~~~~~~~~~~~~~~~~\n\n- Fixed copy() segfault\n- Added CFFI variant\n\nv0.6.3 2017-02-10\n~~~~~~~~~~~~~~~~~~\n\n- Fixed copy() segfault\n\nv0.6.2 2017-02-10\n~~~~~~~~~~~~~~~~~~\n\n- Upgrade xxHash to v0.6.2\n\nv0.6.1 2016-06-26\n~~~~~~~~~~~~~~~~~~\n\n- Upgrade xxHash to v0.6.1\n\nv0.5.0 2016-03-02\n~~~~~~~~~~~~~~~~~~\n\n- Upgrade xxHash to v0.5.0\n\nv0.4.3 2015-08-21\n~~~~~~~~~~~~~~~~~~\n\n- Upgrade xxHash to r42\n\nv0.4.1 2015-08-16\n~~~~~~~~~~~~~~~~~~\n\n- Upgrade xxHash to r41\n\nv0.4.0 2015-08-05\n~~~~~~~~~~~~~~~~~~\n\n- Added method reset\n- Upgrade xxHash to r40\n\nv0.3.2 2015-01-27\n~~~~~~~~~~~~~~~~~~\n\n- Fixed some typos in docstrings\n\nv0.3.1 2015-01-24\n~~~~~~~~~~~~~~~~~~\n\n- Upgrade xxHash to r39\n\nv0.3.0 2014-11-11\n~~~~~~~~~~~~~~~~~~\n\n- Change digest() from little-endian representation to big-endian representation of the integer digest.\n  This change breaks compatibility (digest() results are different).\n\nv0.2.0 2014-10-25\n~~~~~~~~~~~~~~~~~~\n\n- Make this package hashlib-compliant\n\nv0.1.3 2014-10-23\n~~~~~~~~~~~~~~~~~~\n\n- Update xxHash to r37\n\nv0.1.2 2014-10-19\n~~~~~~~~~~~~~~~~~~\n\n- Improve: Check XXHnn_init() return value.\n- Update xxHash to r36\n\nv0.1.1 2014-08-07\n~~~~~~~~~~~~~~~~~~\n\n- Improve: Can now be built with Visual C++ Compiler.\n\nv0.1.0 2014-08-05\n~~~~~~~~~~~~~~~~~~\n\n- New: XXH32 and XXH64 type, which support partially update.\n- Fix: build under Python 3.4\n\nv0.0.2 2014-08-03\n~~~~~~~~~~~~~~~~~~\n\n- NEW: Support Python 3\n\nv0.0.1 2014-07-30\n~~~~~~~~~~~~~~~~~~\n\n- NEW: xxh32 and xxh64\n",
      home_page: "https://github.com/ifduyue/python-xxhash",
      keywords: "",
      license: "BSD",
      metadata_version: "",
      name: "xxhash",
      platform: "",
      summary: "Python binding for xxHash",
      version: "3.6.0",
      classifiers:
        '["Development Status :: 5 - Production/Stable", "License :: OSI Approved :: BSD License", "Intended Audience :: Developers", "Programming Language :: Python", "Programming Language :: Python :: 3", "Programming Language :: Python :: 3 :: Only", "Programming Language :: Python :: 3.7", "Programming Language :: Python :: 3.8", "Programming Language :: Python :: 3.9", "Programming Language :: Python :: 3.10", "Programming Language :: Python :: 3.11", "Programming Language :: Python :: 3.12", "Programming Language :: Python :: 3.13", "Programming Language :: Python :: 3.14", "Programming Language :: Python :: Implementation :: CPython", "Programming Language :: Python :: Free Threading :: 1 - Unstable"]',
      download_url: "",
      supported_platform: "",
      maintainer: "",
      maintainer_email: "",
      obsoletes_dist: "[]",
      project_url: "",
      project_urls: "null",
      provides_dist: "[]",
      requires_external: "[]",
      requires_dist: "null",
      requires_python: ">=3.7",
      description_content_type: "text/x-rst",
      provides_extras: "null",
      dynamic:
        '["author", "author-email", "classifier", "description", "description-content-type", "home-page", "license", "license-file", "requires-python", "summary"]',
      license_expression: "",
      license_file: '["LICENSE"]',
      filename: "xxhash-3.6.0-2-cp312-cp312-linux_ppc64le.whl",
      packagetype: "bdist_wheel",
      python_version: "cp312",
      size: 165975,
      sha256:
        "d9866bd6a4add7c82d9243e2e71d6bd022ae6b7f05c11fade48ef3b7e445b849",
      metadata_sha256: undefined,
      provenance: undefined,
    },
    {
      pulp_href:
        "/api/pulp/calunga-ui-dev/api/v3/content/python/packages/019c2f07-95ae-706d-b76d-188f12a4bf1b/",
      prn: "prn:python.pythonpackagecontent:019c2f07-95ae-706d-b76d-188f12a4bf1b",
      pulp_created: "2026-02-05T18:19:26.078591Z",
      pulp_last_updated: "2026-02-05T18:19:26.078607Z",
      pulp_labels: {},
      vuln_report: undefined,
      artifact: undefined,
      author: "The scikit-build team",
      author_email: "",
      description:
        "\n\n**scikit-build** is a Python build system for CPython C/C++/Fortran/Cython\nextensions using CMake.\n\nThe scikit-build package is fundamentally just glue between the ``setuptools``\nPython module and `CMake`_.\n\nThe next generation of scikit-build, `scikit-build-core`_, is currently under development.\nThis provides a simple, reliable build backend for CMake that does not use\nsetuptools and provides a lot of new features. Scikit-build-core can also power\na setuptools-based extension system, which will eventually become the backend\nfor scikit-build (classic). If you do not require extensive customization of\nthe build process, you should consider trying scikit-build-core instead of\nscikit-build.\n\nTo get started, see `this example <https://scikit-build.readthedocs.io/en/latest/usage.html#example-of-setup-py-cmakelists-txt-and-pyproject-toml>`_. For more examples, see `scikit-build-sample-projects <https://github.com/scikit-build/scikit-build-sample-projects>`_.\n\n\n\nScikit-build 0.18.1\n===================\n\nThis release fixes issues with setuptools 74, and avoids a warning from recent\nversions of wheel. Android and iOS are now included in known platforms.\n\nBug fixes\n---------\n\n* Support for setuptools 74 in `#1116 <https://github.com/scikit-build/scikit-build/pull/1116>`_\n* iOS and Android support by `@FeodorFitsner <https://github.com/FeodorFitsner>`_ in `#1101 <https://github.com/scikit-build/scikit-build/pull/1101>`_\n\n\nTesting\n-------\n\n* Fix for distutils change in `#1103 <https://github.com/scikit-build/scikit-build/pull/1103>`_\n* Remove test directives by `@s-t-e-v-e-n-k <https://github.com/s-t-e-v-e-n-k>`_ in `#1108 <https://github.com/scikit-build/scikit-build/pull/1108>`_\n\n\n\nScikit-build 0.18.0\n===================\n\nThis release bumps the minimum required CMake to 3.5 and supports CPython 3.13.\n\nBug fixes\n---------\n\n* Support MSVC 17.10 in `#1081 <https://github.com/scikit-build/scikit-build/pull/1081>`_\n* CMake 3.5+ requirement in `#1095 <https://github.com/scikit-build/scikit-build/pull/1095>`_\n* Support CPython 3.13 with windows lib finding fix in `#1094 <https://github.com/scikit-build/scikit-build/pull/1094>`_\n* Don't die on PermissionError during chmod by `@mweinelt <https://github.com/mweinelt>`_ in `#1073 <https://github.com/scikit-build/scikit-build/pull/1073>`_\n* Remove usage of deprecated distutils in cmake files by `@hmaarrfk <https://github.com/hmaarrfk>`_ in `#1032 <https://github.com/scikit-build/scikit-build/pull/1032>`_\n* Use first available option for vswhere output by `@ZzEeKkAa <https://github.com/ZzEeKkAa>`_ in `#1030 <https://github.com/scikit-build/scikit-build/pull/1030>`_\n\n\nTesting\n-------\n\n* Support setuptools 69.3.0 changes in two tests by `@s-t-e-v-e-n-k <https://github.com/s-t-e-v-e-n-k>`_ in `#1087 <https://github.com/scikit-build/scikit-build/pull/1087>`_\n* Use uv in a few places in `#1092 <https://github.com/scikit-build/scikit-build/pull/1092>`_\n\nFedora CI\n---------\n\n* Fedora maintenance by `@LecrisUT <https://github.com/LecrisUT>`_ in `#1078 <https://github.com/scikit-build/scikit-build/pull/1078>`_\n* Fedora: Fix rsync filter rule by `@LecrisUT <https://github.com/LecrisUT>`_ in `#1003 <https://github.com/scikit-build/scikit-build/pull/1003>`_\n* Fix Fedora tests by `@LecrisUT <https://github.com/LecrisUT>`_ in `#1050 <https://github.com/scikit-build/scikit-build/pull/1050>`_\n* Fedora downstream CI by `@LecrisUT <https://github.com/LecrisUT>`_ in `#993 <https://github.com/scikit-build/scikit-build/pull/993>`_\n\nMiscellaneous\n-------------\n\n* Clean up pylint in `#1017 <https://github.com/scikit-build/scikit-build/pull/1017>`_\n* Fix mypy type ignores for new setuptools types in `#1082 <https://github.com/scikit-build/scikit-build/pull/1082>`_\n* Move to Ruff-format in `#1035 <https://github.com/scikit-build/scikit-build/pull/1035>`_\n* Remove pkg_resources and test command in `#1014 <https://github.com/scikit-build/scikit-build/pull/1014>`_\n* Ruff moved to astral-sh in `#1007 <https://github.com/scikit-build/scikit-build/pull/1007>`_\n* Target-version no longer needed by Black or Ruff in `#1008 <https://github.com/scikit-build/scikit-build/pull/1008>`_\n* Update ruff and fix warnings in `#1060 <https://github.com/scikit-build/scikit-build/pull/1060>`_\n* Use 2x faster black mirror in `#1021 <https://github.com/scikit-build/scikit-build/pull/1021>`_\n* Group dependabot updates in `#1054 <https://github.com/scikit-build/scikit-build/pull/1054>`_\n* macos-latest is changing to macos-14 ARM runners in `#1083 <https://github.com/scikit-build/scikit-build/pull/1083>`_\n* Skip win PyPy PEP 518 in `#1091 <https://github.com/scikit-build/scikit-build/pull/1091>`_\n\n\nScikit-build 0.17.6\n===================\n\nA small fix release with some new platforms and better testing, including CPython 3.12.0b1.\n\nBug fixes\n---------\n\n* Support added for SunOS by `@mtelka <https://github.com/mtelka>`_ in `#983 <https://github.com/scikit-build/scikit-build/pull/983>`_.\n* Support added for AIX (with recent CMake) by `@bhuntsman <https://github.com/bhuntsman>`_ in `#988 <https://github.com/scikit-build/scikit-build/pull/988>`_.\n\nTesting\n-------\n\n* Tests now pass on CPython 3.12.0b1 in `#879 <https://github.com/scikit-build/scikit-build/pull/879>`_.\n* Tests no longer use ``pytest-virtualenv`` in `#879 <https://github.com/scikit-build/scikit-build/pull/879>`_.\n* ``isolated`` marker now includes ``test_distribution`` tests in `#879 <https://github.com/scikit-build/scikit-build/pull/879>`_.\n* Tests avoid incorrect ``get_map`` match by `@keszybz <https://github.com/keszybz>`_ in `#990 <https://github.com/scikit-build/scikit-build/pull/990>`_.\n* Fedora testing fix by `@LecrisUT <https://github.com/LecrisUT>`_ in `#986 <https://github.com/scikit-build/scikit-build/pull/986>`_ and `#938 <https://github.com/scikit-build/scikit-build/pull/938>`_.\n\nMiscellaneous\n-------------\n\n* Docs improvements in `#979 <https://github.com/scikit-build/scikit-build/pull/979>`_.\n\nScikit-build 0.17.5\n===================\n\nA small fix release fixing the passing on of generator specific arguments. This\nfixes some cases where the Ninja generator was found but then was unable to\nbuild. NetBSD was reported to work, so was added to the BSD's supported.\n\nBug fixes\n---------\n\n* Generator args were missing for actual compile in `#975 <https://github.com/scikit-build/scikit-build/pull/975>`_.\n* Add support for netbsd & pyodide (future) in `#977 <https://github.com/scikit-build/scikit-build/pull/977>`_.\n\n\n\nScikit-build 0.17.4\n===================\n\nA followup fix to the issue 0.17.3 tried to fix. We now have a method to\nmanually test downstream packages, too.\n\nBug fixes\n---------\n\n* Make sure include dir is found even if the lib is not present in `#974 <https://github.com/scikit-build/scikit-build/pull/974>`_.\n\nScikit-build 0.17.3\n===================\n\nA small release related to ``PYTHON_LIBRARY`` handling changes in 0.17.2;\nscikit-build 0.17.3 returns an empty string from ``get_python_library`` if no\nPython library is present (like on manylinux), where 0.17.2 returned None, and\nprevious versions returned a non-existent path. Note that adding ``REQUIRED``\nto ``find_package(PythonLibs`` will fail, but it is incorrect (you must not\nlink to ``libPython.so``) and was really just injecting a non-existent path\nbefore.\n\nBug fixes\n---------\n\n* Keep ``get_python_library``  return type string if python lib non-existing\n  for now in `#959 <https://github.com/scikit-build/scikit-build/pull/959>`_.\n* Avoid 'not found' warning if libs are not found by FindPythonExtensions in `#960 <https://github.com/scikit-build/scikit-build/pull/960>`_.\n* FindNumPy should not call FindPythonLibs in `#958 <https://github.com/scikit-build/scikit-build/pull/958>`_.\n\nScikit-build 0.17.2\n===================\n\nAnother small release with fixes for non-MSVC Windows platforms.\n\nBug fixes\n---------\n\n* RPM spec fix by `@LecrisUT <https://github.com/LecrisUT>`_ in `#937 <https://github.com/scikit-build/scikit-build/pull/937>`_.\n* Validate value before returning library path by `@dlech <https://github.com/dlech>`_ in `#942 <https://github.com/scikit-build/scikit-build/pull/942>`_.\n* Only add ``Python_LIBRARY`` on Windows MSVC in `#943 <https://github.com/scikit-build/scikit-build/pull/943>`_ and `#944 <https://github.com/scikit-build/scikit-build/pull/944>`_.\n* Slightly nicer traceback for failed compiler in `#947 <https://github.com/scikit-build/scikit-build/pull/947>`_.\n\nTesting\n-------\n* Hide a few warnings that are expected in `#948 <https://github.com/scikit-build/scikit-build/pull/948>`_.\n\nScikit-build 0.17.1\n===================\n\nThis is a small release fixing a few bugs; the primary one being a change that\nwas triggering a bug in older FindPython. The unused variable messages have\nbeen deactivated to simplify output, as well.\n\nBug fixes\n---------\n\n* Older (<3.24) CMake breaks when lib specified in `#932 <https://github.com/scikit-build/scikit-build/pull/932>`_.\n* An error output was missing formatting in `#931 <https://github.com/scikit-build/scikit-build/pull/931>`_.\n* Make empty ``CMAKE_OSX_DEPLOYMENT_TARGET`` a warning (bug in conda-forge's\n  clang activation fixed upstream) in `#934 <https://github.com/scikit-build/scikit-build/pull/934>`_.\n* Remove unused variable warnings by in `#930 <https://github.com/scikit-build/scikit-build/pull/930>`_.\n\nTesting\n-------\n\n* Add Fedora packaging with packit automation by `@LecrisUT <https://github.com/LecrisUT>`_ in `#928 <https://github.com/scikit-build/scikit-build/pull/928>`_.\n* Fix codecov ci by `@LecrisUT <https://github.com/LecrisUT>`_ in `#929 <https://github.com/scikit-build/scikit-build/pull/929>`_.\n* Update some coverage settings in `#933 <https://github.com/scikit-build/scikit-build/pull/933>`_.\n\n\n\nScikit-build 0.17.0\n===================\n\nA lot of bug fixes are present in this release, focusing on Windows, PyPy, and\ncross compiling. We've also improved the compatibility with default setuptools\nbehaviors a little, and enabled some things that were previously unavailable,\nlike overriding the build type via the cmake argument environment variables.\nWe've expanded our CI matrix to include Windows and macOS PyPy and some Fortran\ntests on Linux. This release requires Python 3.7+.\n\nBug fixes\n---------\n\n* Match setuptools behavior for ``include_package_data`` default. by `@vyasr <https://github.com/vyasr>`_ in `#873 <https://github.com/scikit-build/scikit-build/pull/873>`_.\n* Misc. fixes for F2PY and PythonExtensions modules by `@benbovy <https://github.com/benbovy>`_ in `#495 <https://github.com/scikit-build/scikit-build/pull/495>`_.\n* Provide more useful error if user provides ``CMAKE_INSTALL_PREFIX`` by `@vyasr <https://github.com/vyasr>`_ in `#872 <https://github.com/scikit-build/scikit-build/pull/872>`_.\n* Stop assuming that ``.pyx`` files are in the same directory as ``CMakeLists.txt`` by `@vyasr <https://github.com/vyasr>`_ in `#871 <https://github.com/scikit-build/scikit-build/pull/871>`_.\n* Allow build type overriding in `#902 <https://github.com/scikit-build/scikit-build/pull/902>`_.\n* Detect PyPy library correctly on Windows by user:`gershnik` in `#904 <https://github.com/scikit-build/scikit-build/pull/904>`_.\n* Include library for FindPython for better Windows cross-compiles in `#913 <https://github.com/scikit-build/scikit-build/pull/913>`_. Thanks to user:`maxbachmann` for testing.\n* Fix logic for default generator when cross-compiling for ARM on Windows in `#917 <https://github.com/scikit-build/scikit-build/pull/917>`_ by `@dlech <https://github.com/dlech>`_.\n* Use f2py's ``get_include`` if present in `#877 <https://github.com/scikit-build/scikit-build/pull/877>`_.\n* Fix support for cross-compilation exception using ``targetLinkLibrariesWithDynamicLookup`` by `@erykoff <https://github.com/erykoff>`_ in `#901 <https://github.com/scikit-build/scikit-build/pull/901>`_.\n* Treat empty ``MACOSX_DEPLOYMENT_TARGET`` as if it was unset in `#918 <https://github.com/scikit-build/scikit-build/pull/918>`_.\n\nTesting\n-------\n\n* Add hello fortran sample package + tests by `@benbovy <https://github.com/benbovy>`_ in `#493 <https://github.com/scikit-build/scikit-build/pull/493>`_.\n* Add sdist check & fix in `#906 <https://github.com/scikit-build/scikit-build/pull/906>`_.\n* Fix some setuptools types in `#888 <https://github.com/scikit-build/scikit-build/pull/888>`_.\n* Add PyPy Win & macOS to the CI in `#907 <https://github.com/scikit-build/scikit-build/pull/907>`_.\n* Add tests for Python 3.12 Linux alphas in `#922 <https://github.com/scikit-build/scikit-build/pull/922>`_.\n\nMiscellaneous\n-------------\n\n* Drop Python 3.6 in `#862 <https://github.com/scikit-build/scikit-build/pull/862>`_.\n* Move building backend to hatchling in `#870 <https://github.com/scikit-build/scikit-build/pull/870>`_.\n* Avoid mutating function input parameters in `#899 <https://github.com/scikit-build/scikit-build/pull/899>`_.\n* Use _compat/typing name in `#869 <https://github.com/scikit-build/scikit-build/pull/869>`_.\n\n\n\nPublications\n------------\n\nPlease use the first citation when referencing scikit-build in scientific publications.\n\n* Jean-Christophe Fillion-Robin, Matt McCormick, Omar Padron, Max Smolens, Michael Grauer, & Michael Sarahan. (2018, July 13). jcfr/scipy_2018_scikit-build_talk: SciPy 2018 Talk | scikit-build: A Build System Generator for CPython C/C++/Fortran/Cython Extensions. Zenodo. https://doi.org/10.5281/zenodo.2565368\n\n* Schreiner, Henry, Rickerby, Joe, Grosse-Kunstleve, Ralf, Jakob, Wenzel, Darbois, Matthieu, Gokaslan, Aaron, Fillion-Robin, Jean-Christophe, & McCormick, Matt. (2022, August 1). Building Binary Extensions with pybind11, scikit-build, and cibuildwheel. https://doi.org/10.25080/majora-212e5952-033\n\n\nHistory\n-------\n\nPyCMake was created at SciPy 2014 in response to general difficulties building\nC++ and Fortran based Python extensions across platforms.  It was renamed to\n\"scikit-build\" in 2016. Scikit-build-core was started in 2022.\n\n\nKnown Issues\n------------\n\nThese issues are likely to be addressed in upcoming releases, and are\nalready addressed in `scikit-build-core`_.\n\n* Editable installs do not work with the latest versions of Setuptools (and had\n  issues with older versions, too).\n* Configuration scikit-build cares about _must_ be specified in ``setup()``\n  currently.\n* The cache directory (``_skbuild``) may need to be deleted between builds in\n  some cases (like rebuilding with a different Python interpreter).\n* AIX requires a newer version of CMake than the IBM-supplied CMake 3.22.0\n  from the AIX Toolbox for Open Source Software.  We currently recommend\n  building CMake from source on AIX.\n\nWe are also working on improving scikit-build, so there are some upcoming\nchanges and deprecations:\n\n* All deprecated setuptools/distutils features are also deprecated in\n  scikit-build, like the ``test`` command, ``easy_install``, etc.\n* Older versions of CMake (<3.15) are not recommended; a future version will\n  remove support for older CMake's (along with providing a better mechanism for\n  ensuring a proper CMake is available).\n\nIf you need any of these features, please open or find an issue explaining what\nand why you need something.\n\nMiscellaneous\n-------------\n\n* Free software: MIT license\n* Documentation: http://scikit-build.readthedocs.org\n* Source code: https://github.com/scikit-build/scikit-build\n* Discussions: https://github.com/orgs/scikit-build/discussions\n* Scikit-build-core: https://github.com/scikit-build/scikit-build-core\n\n\nSupport for this work was provided by NSF grant `OAC-2209877 <https://www.nsf.gov/awardsearch/showAward?AWD_ID=2209877>`_.\n\n.. _scikit-build-core: https://scikit-build-core.readthedocs.io\n.. _cmake: https://cmake.org\n",
      home_page: "",
      keywords: "scikit-build",
      license: "",
      metadata_version: "",
      name: "scikit-build",
      platform: "",
      summary:
        "Improved build system generator for Python C/C++/Fortran/Cython extensions",
      version: "0.18.1",
      classifiers:
        '["Development Status :: 2 - Pre-Alpha", "Intended Audience :: Developers", "License :: OSI Approved :: MIT License", "Natural Language :: English", "Programming Language :: Python :: 3 :: Only", "Programming Language :: Python :: 3.7", "Programming Language :: Python :: 3.8", "Programming Language :: Python :: 3.9", "Programming Language :: Python :: 3.10", "Programming Language :: Python :: 3.11", "Programming Language :: Python :: 3.12", "Programming Language :: Python :: 3.13", "Typing :: Typed"]',
      download_url: "",
      supported_platform: "",
      maintainer: "",
      maintainer_email: "",
      obsoletes_dist: "[]",
      project_url: "",
      project_urls:
        '["Bug Tracker, https://github.com/scikit-build/scikit-build/issues", "Changelog, https://scikit-build.readthedocs.io/en/latest/history.html", "Discussions, https://github.com/orgs/scikit-build/discussions", "Documentation, https://scikit-build.readthedocs.io/", "Examples, https://github.com/scikit-build/scikit-build-sample-projects", "Homepage, https://github.com/scikit-build/scikit-build"]',
      provides_dist: "[]",
      requires_external: "[]",
      requires_dist:
        '["distro", "packaging", "setuptools>=42.0.0", "tomli; python_version < \'3.11\'", "typing-extensions>=3.7; python_version < \'3.8\'", "wheel>=0.32.0", "coverage[toml]>=4.2; extra == \'cov\'", "pytest-cov>=2.7.1; extra == \'cov\'", "pygments; extra == \'docs\'", "sphinx-issues; extra == \'docs\'", "sphinx-rtd-theme>=1.0; extra == \'docs\'", "sphinx>=4; extra == \'docs\'", "sphinxcontrib-moderncmakedomain>=3.19; extra == \'docs\'", "ubelt>=0.8.2; extra == \'doctest\'", "xdoctest>=0.10.0; extra == \'doctest\'", "build>=0.7; extra == \'test\'", "cython>=0.25.1; extra == \'test\'", "importlib-metadata; (python_version < \'3.8\') and extra == \'test\'", "pip; extra == \'test\'", "pytest-mock>=1.10.4; extra == \'test\'", "pytest>=6.0.0; extra == \'test\'", "requests; extra == \'test\'", "virtualenv; extra == \'test\'"]',
      requires_python: ">=3.7",
      description_content_type: "text/x-rst",
      provides_extras: '["cov", "docs", "doctest", "test"]',
      dynamic: "null",
      license_expression: "",
      license_file: '["AUTHORS.rst", "LICENSE"]',
      filename: "scikit_build-0.18.1-2-py3-none-any.whl",
      packagetype: "bdist_wheel",
      python_version: "py3",
      size: 86623,
      sha256:
        "c8512069e2fcfc31334e5ac49b76d0a0f43348dca35780eb2bb853dd9ddfd7e1",
      metadata_sha256: undefined,
      provenance: undefined,
    },
    {
      pulp_href:
        "/api/pulp/calunga-ui-dev/api/v3/content/python/packages/019c2f07-ae19-7d73-bdbf-362a1678215d/",
      prn: "prn:python.pythonpackagecontent:019c2f07-ae19-7d73-bdbf-362a1678215d",
      pulp_created: "2026-02-05T18:19:26.069177Z",
      pulp_last_updated: "2026-02-05T18:19:26.069191Z",
      pulp_labels: {},
      vuln_report: undefined,
      artifact: undefined,
      author: "Facebook",
      author_email: "python-tornado@googlegroups.com",
      description:
        'Tornado Web Server\n==================\n\n.. image:: https://badges.gitter.im/Join%20Chat.svg\n   :alt: Join the chat at https://gitter.im/tornadoweb/tornado\n   :target: https://gitter.im/tornadoweb/tornado?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge\n\n`Tornado <http://www.tornadoweb.org>`_ is a Python web framework and\nasynchronous networking library, originally developed at `FriendFeed\n<http://friendfeed.com>`_.  By using non-blocking network I/O, Tornado\ncan scale to tens of thousands of open connections, making it ideal for\n`long polling <http://en.wikipedia.org/wiki/Push_technology#Long_Polling>`_,\n`WebSockets <http://en.wikipedia.org/wiki/WebSocket>`_, and other\napplications that require a long-lived connection to each user.\n\nHello, world\n------------\n\nHere is a simple "Hello, world" example web app for Tornado:\n\n.. code-block:: python\n\n    import asyncio\n    import tornado\n\n    class MainHandler(tornado.web.RequestHandler):\n        def get(self):\n            self.write("Hello, world")\n\n    def make_app():\n        return tornado.web.Application([\n            (r"/", MainHandler),\n        ])\n\n    async def main():\n        app = make_app()\n        app.listen(8888)\n        await asyncio.Event().wait()\n\n    if __name__ == "__main__":\n        asyncio.run(main())\n\nThis example does not use any of Tornado\'s asynchronous features; for\nthat see this `simple chat room\n<https://github.com/tornadoweb/tornado/tree/stable/demos/chat>`_.\n\nDocumentation\n-------------\n\nDocumentation and links to additional resources are available at\nhttps://www.tornadoweb.org\n',
      home_page: "http://www.tornadoweb.org/",
      keywords: "",
      license: "Apache-2.0",
      metadata_version: "",
      name: "tornado",
      platform: "",
      summary:
        "Tornado is a Python web framework and asynchronous networking library, originally developed at FriendFeed.",
      version: "6.5.4",
      classifiers:
        '["License :: OSI Approved :: Apache Software License", "Programming Language :: Python :: 3", "Programming Language :: Python :: 3.9", "Programming Language :: Python :: 3.10", "Programming Language :: Python :: 3.11", "Programming Language :: Python :: 3.12", "Programming Language :: Python :: 3.13", "Programming Language :: Python :: Implementation :: CPython", "Programming Language :: Python :: Implementation :: PyPy"]',
      download_url: "",
      supported_platform: "",
      maintainer: "",
      maintainer_email: "",
      obsoletes_dist: "[]",
      project_url: "",
      project_urls: '["Source, https://github.com/tornadoweb/tornado"]',
      provides_dist: "[]",
      requires_external: "[]",
      requires_dist: "null",
      requires_python: ">= 3.9",
      description_content_type: "text/x-rst",
      provides_extras: "null",
      dynamic:
        '["author", "author-email", "classifier", "description", "description-content-type", "home-page", "license", "license-file", "project-url", "requires-python", "summary"]',
      license_expression: "",
      license_file: '["LICENSE"]',
      filename: "tornado-6.5.4-2-cp39-abi3-linux_ppc64le.whl",
      packagetype: "bdist_wheel",
      python_version: "cp39",
      size: 445681,
      sha256:
        "be68f2c30d855e21a11c7e5a6cdaf6e7d12b8373e703798ad75f79422732b02a",
      metadata_sha256: undefined,
      provenance: undefined,
    },
  ],
};

export const packageMock: PythonPythonPackageContentResponse = {
  pulp_href:
    "/api/pulp/calunga-ui-dev/api/v3/content/python/packages/019c24e4-8d46-75b2-b2fb-68fb77a67df0/",
  prn: "prn:python.pythonpackagecontent:019c24e4-8d46-75b2-b2fb-68fb77a67df0",
  pulp_created: "2026-02-03T19:04:58.854549Z",
  pulp_last_updated: "2026-02-03T19:04:58.854591Z",
  pulp_labels: {},
  vuln_report: undefined,
  artifact: undefined,
  author: "",
  author_email: "",
  description:
    '.. image:: https://raw.githubusercontent.com/scipy/scipy/main/doc/source/_static/logo.svg\n  :target: https://scipy.org\n  :width: 110\n  :height: 110\n  :align: left \n\n.. image:: https://img.shields.io/badge/powered%20by-NumFOCUS-orange.svg?style=flat&colorA=E1523D&colorB=007D8A\n  :target: https://numfocus.org\n\n.. image:: https://img.shields.io/pypi/dm/scipy.svg?label=Pypi%20downloads\n  :target: https://pypi.org/project/scipy/\n\n.. image:: https://img.shields.io/conda/dn/conda-forge/scipy.svg?label=Conda%20downloads\n  :target: https://anaconda.org/conda-forge/scipy\n\n.. image:: https://img.shields.io/badge/stackoverflow-Ask%20questions-blue.svg\n  :target: https://stackoverflow.com/questions/tagged/scipy\n\n.. image:: https://img.shields.io/badge/DOI-10.1038%2Fs41592--019--0686--2-blue.svg\n  :target: https://www.nature.com/articles/s41592-019-0686-2\n\n.. image:: https://insights.linuxfoundation.org/api/badge/health-score?project=scipy\n  :target: https://insights.linuxfoundation.org/project/scipy\n\nSciPy (pronounced "Sigh Pie") is an open-source software for mathematics,\nscience, and engineering. It includes modules for statistics, optimization,\nintegration, linear algebra, Fourier transforms, signal and image processing,\nODE solvers, and more.\n\n- **Website:** https://scipy.org\n- **Documentation:** https://docs.scipy.org/doc/scipy/\n- **Development version of the documentation:** https://scipy.github.io/devdocs\n- **SciPy development forum:** https://discuss.scientific-python.org/c/contributor/scipy\n- **Stack Overflow:** https://stackoverflow.com/questions/tagged/scipy\n- **Source code:** https://github.com/scipy/scipy\n- **Contributing:** https://scipy.github.io/devdocs/dev/index.html\n- **Bug reports:** https://github.com/scipy/scipy/issues\n- **Code of Conduct:** https://docs.scipy.org/doc/scipy/dev/conduct/code_of_conduct.html\n- **Report a security vulnerability:** https://tidelift.com/docs/security\n- **Citing in your work:** https://www.scipy.org/citing-scipy/\n\nSciPy is built to work with\nNumPy arrays, and provides many user-friendly and efficient numerical routines,\nsuch as routines for numerical integration and optimization. Together, they\nrun on all popular operating systems, are quick to install, and are free of\ncharge. NumPy and SciPy are easy to use, but powerful enough to be depended\nupon by some of the world\'s leading scientists and engineers. If you need to\nmanipulate numbers on a computer and display or publish the results, give\nSciPy a try!\n\nFor the installation instructions, see `our install\nguide <https://scipy.org/install/>`__.\n\n\nCall for Contributions\n----------------------\n\nWe appreciate and welcome contributions. Small improvements or fixes are always appreciated; issues labeled as "good\nfirst issue" may be a good starting point. Have a look at `our contributing\nguide <https://scipy.github.io/devdocs/dev/index.html>`__.\n\nWriting code isn’t the only way to contribute to SciPy. You can also:\n\n- review pull requests\n- triage issues\n- develop tutorials, presentations, and other educational materials\n- maintain and improve `our website <https://github.com/scipy/scipy.org>`__\n- develop graphic design for our brand assets and promotional materials\n- help with outreach and onboard new contributors\n- write grant proposals and help with other fundraising efforts\n\nIf you’re unsure where to start or how your skills fit in, reach out! You can\nask on the `forum <https://discuss.scientific-python.org/c/contributor/scipy>`__\nor here, on GitHub, by leaving a comment on a relevant issue that is already\nopen.\n\nIf you are new to contributing to open source, `this\nguide <https://opensource.guide/how-to-contribute/>`__ helps explain why, what,\nand how to get involved.\n',
  home_page: "",
  keywords: "",
  license:
    'Copyright (c) 2001-2002 Enthought, Inc. 2003, SciPy Developers.\n         All rights reserved.\n         \n         Redistribution and use in source and binary forms, with or without\n         modification, are permitted provided that the following conditions\n         are met:\n         \n         1. Redistributions of source code must retain the above copyright\n            notice, this list of conditions and the following disclaimer.\n         \n         2. Redistributions in binary form must reproduce the above\n            copyright notice, this list of conditions and the following\n            disclaimer in the documentation and/or other materials provided\n            with the distribution.\n         \n         3. Neither the name of the copyright holder nor the names of its\n            contributors may be used to endorse or promote products derived\n            from this software without specific prior written permission.\n         \n         THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS\n         "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT\n         LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR\n         A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT\n         OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,\n         SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT\n         LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,\n         DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY\n         THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT\n         (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE\n         OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n         \n         ----\n         \n         This binary distribution of SciPy can also bundle the following software\n         (depending on the build):\n         \n         \n         Name: OpenBLAS\n         Files: scipy/.dylibs/libscipy_openblas*.so\n         Description: bundled as a dynamically linked library\n         Availability: https://github.com/OpenMathLib/OpenBLAS/\n         License: BSD-3-Clause\n           Copyright (c) 2011-2014, The OpenBLAS Project\n           All rights reserved.\n         \n           Redistribution and use in source and binary forms, with or without\n           modification, are permitted provided that the following conditions are\n           met:\n         \n              1. Redistributions of source code must retain the above copyright\n                 notice, this list of conditions and the following disclaimer.\n         \n              2. Redistributions in binary form must reproduce the above copyright\n                 notice, this list of conditions and the following disclaimer in\n                 the documentation and/or other materials provided with the\n                 distribution.\n              3. Neither the name of the OpenBLAS project nor the names of\n                 its contributors may be used to endorse or promote products\n                 derived from this software without specific prior written\n                 permission.\n         \n           THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"\n           AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE\n           IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE\n           ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE\n           LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL\n           DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR\n           SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER\n           CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,\n           OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE\n           USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n         \n         \n         Name: LAPACK\n         Files: scipy/.dylibs/libscipy_openblas*.so\n         Description: bundled in OpenBLAS\n         Availability: https://github.com/OpenMathLib/OpenBLAS/\n         License: BSD-3-Clause-Open-MPI\n           Copyright (c) 1992-2013 The University of Tennessee and The University\n                                   of Tennessee Research Foundation.  All rights\n                                   reserved.\n           Copyright (c) 2000-2013 The University of California Berkeley. All\n                                   rights reserved.\n           Copyright (c) 2006-2013 The University of Colorado Denver.  All rights\n                                   reserved.\n         \n           $COPYRIGHT$\n         \n           Additional copyrights may follow\n         \n           $HEADER$\n         \n           Redistribution and use in source and binary forms, with or without\n           modification, are permitted provided that the following conditions are\n           met:\n         \n           - Redistributions of source code must retain the above copyright\n             notice, this list of conditions and the following disclaimer.\n         \n           - Redistributions in binary form must reproduce the above copyright\n             notice, this list of conditions and the following disclaimer listed\n             in this license in the documentation and/or other materials\n             provided with the distribution.\n         \n           - Neither the name of the copyright holders nor the names of its\n             contributors may be used to endorse or promote products derived from\n             this software without specific prior written permission.\n         \n           The copyright holders provide no reassurances that the source code\n           provided does not infringe any patent, copyright, or any other\n           intellectual property rights of third parties.  The copyright holders\n           disclaim any liability to any recipient for claims brought against\n           recipient by any third party for infringement of that parties\n           intellectual property rights.\n         \n           THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS\n           "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT\n           LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR\n           A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT\n           OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,\n           SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT\n           LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,\n           DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY\n           THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT\n           (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE\n           OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n         \n         \n         Name: GCC runtime library\n         Files: scipy/.dylibs/libgfortran*, scipy/.dylibs/libgcc*\n         Description: dynamically linked to files compiled with gcc\n         Availability: https://gcc.gnu.org/git/?p=gcc.git;a=tree;f=libgfortran\n         License: GPL-3.0-or-later WITH GCC-exception-3.1\n           Copyright (C) 2002-2017 Free Software Foundation, Inc.\n           \n           Libgfortran is free software; you can redistribute it and/or modify\n           it under the terms of the GNU General Public License as published by\n           the Free Software Foundation; either version 3, or (at your option)\n           any later version.\n           \n           Libgfortran is distributed in the hope that it will be useful,\n           but WITHOUT ANY WARRANTY; without even the implied warranty of\n           MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n           GNU General Public License for more details.\n           \n           Under Section 7 of GPL version 3, you are granted additional\n           permissions described in the GCC Runtime Library Exception, version\n           3.1, as published by the Free Software Foundation.\n           \n           You should have received a copy of the GNU General Public License and\n           a copy of the GCC Runtime Library Exception along with this program;\n           see the files COPYING3 and COPYING.RUNTIME respectively.  If not, see\n           <http://www.gnu.org/licenses/>.\n         \n         ----\n         \n         Full text of license texts referred to above follows (that they are\n         listed below does not necessarily imply the conditions apply to the\n         present binary release):\n         \n         ----\n         \n         GCC RUNTIME LIBRARY EXCEPTION\n         \n         Version 3.1, 31 March 2009\n         \n         Copyright (C) 2009 Free Software Foundation, Inc. <http://fsf.org/>\n         \n         Everyone is permitted to copy and distribute verbatim copies of this\n         license document, but changing it is not allowed.\n         \n         This GCC Runtime Library Exception ("Exception") is an additional\n         permission under section 7 of the GNU General Public License, version\n         3 ("GPLv3"). It applies to a given file (the "Runtime Library") that\n         bears a notice placed by the copyright holder of the file stating that\n         the file is governed by GPLv3 along with this Exception.\n         \n         When you use GCC to compile a program, GCC may combine portions of\n         certain GCC header files and runtime libraries with the compiled\n         program. The purpose of this Exception is to allow compilation of\n         non-GPL (including proprietary) programs to use, in this way, the\n         header files and runtime libraries covered by this Exception.\n         \n         0. Definitions.\n         \n         A file is an "Independent Module" if it either requires the Runtime\n         Library for execution after a Compilation Process, or makes use of an\n         interface provided by the Runtime Library, but is not otherwise based\n         on the Runtime Library.\n         \n         "GCC" means a version of the GNU Compiler Collection, with or without\n         modifications, governed by version 3 (or a specified later version) of\n         the GNU General Public License (GPL) with the option of using any\n         subsequent versions published by the FSF.\n         \n         "GPL-compatible Software" is software whose conditions of propagation,\n         modification and use would permit combination with GCC in accord with\n         the license of GCC.\n         \n         "Target Code" refers to output from any compiler for a real or virtual\n         target processor architecture, in executable form or suitable for\n         input to an assembler, loader, linker and/or execution\n         phase. Notwithstanding that, Target Code does not include data in any\n         format that is used as a compiler intermediate representation, or used\n         for producing a compiler intermediate representation.\n         \n         The "Compilation Process" transforms code entirely represented in\n         non-intermediate languages designed for human-written code, and/or in\n         Java Virtual Machine byte code, into Target Code. Thus, for example,\n         use of source code generators and preprocessors need not be considered\n         part of the Compilation Process, since the Compilation Process can be\n         understood as starting with the output of the generators or\n         preprocessors.\n         \n         A Compilation Process is "Eligible" if it is done using GCC, alone or\n         with other GPL-compatible software, or if it is done without using any\n         work based on GCC. For example, using non-GPL-compatible Software to\n         optimize any GCC intermediate representations would not qualify as an\n         Eligible Compilation Process.\n         \n         1. Grant of Additional Permission.\n         \n         You have permission to propagate a work of Target Code formed by\n         combining the Runtime Library with Independent Modules, even if such\n         propagation would otherwise violate the terms of GPLv3, provided that\n         all Target Code was generated by Eligible Compilation Processes. You\n         may then convey such a combination under terms of your choice,\n         consistent with the licensing of the Independent Modules.\n         \n         2. No Weakening of GCC Copyleft.\n         \n         The availability of this Exception does not imply any general\n         presumption that third-party software is unaffected by the copyleft\n         requirements of the license of GCC.\n         \n         ----\n         \n                             GNU GENERAL PUBLIC LICENSE\n                                Version 3, 29 June 2007\n         \n          Copyright (C) 2007 Free Software Foundation, Inc. <http://fsf.org/>\n          Everyone is permitted to copy and distribute verbatim copies\n          of this license document, but changing it is not allowed.\n         \n                                     Preamble\n         \n           The GNU General Public License is a free, copyleft license for\n         software and other kinds of works.\n         \n           The licenses for most software and other practical works are designed\n         to take away your freedom to share and change the works.  By contrast,\n         the GNU General Public License is intended to guarantee your freedom to\n         share and change all versions of a program--to make sure it remains free\n         software for all its users.  We, the Free Software Foundation, use the\n         GNU General Public License for most of our software; it applies also to\n         any other work released this way by its authors.  You can apply it to\n         your programs, too.\n         \n           When we speak of free software, we are referring to freedom, not\n         price.  Our General Public Licenses are designed to make sure that you\n         have the freedom to distribute copies of free software (and charge for\n         them if you wish), that you receive source code or can get it if you\n         want it, that you can change the software or use pieces of it in new\n         free programs, and that you know you can do these things.\n         \n           To protect your rights, we need to prevent others from denying you\n         these rights or asking you to surrender the rights.  Therefore, you have\n         certain responsibilities if you distribute copies of the software, or if\n         you modify it: responsibilities to respect the freedom of others.\n         \n           For example, if you distribute copies of such a program, whether\n         gratis or for a fee, you must pass on to the recipients the same\n         freedoms that you received.  You must make sure that they, too, receive\n         or can get the source code.  And you must show them these terms so they\n         know their rights.\n         \n           Developers that use the GNU GPL protect your rights with two steps:\n         (1) assert copyright on the software, and (2) offer you this License\n         giving you legal permission to copy, distribute and/or modify it.\n         \n           For the developers\' and authors\' protection, the GPL clearly explains\n         that there is no warranty for this free software.  For both users\' and\n         authors\' sake, the GPL requires that modified versions be marked as\n         changed, so that their problems will not be attributed erroneously to\n         authors of previous versions.\n         \n           Some devices are designed to deny users access to install or run\n         modified versions of the software inside them, although the manufacturer\n         can do so.  This is fundamentally incompatible with the aim of\n         protecting users\' freedom to change the software.  The systematic\n         pattern of such abuse occurs in the area of products for individuals to\n         use, which is precisely where it is most unacceptable.  Therefore, we\n         have designed this version of the GPL to prohibit the practice for those\n         products.  If such problems arise substantially in other domains, we\n         stand ready to extend this provision to those domains in future versions\n         of the GPL, as needed to protect the freedom of users.\n         \n           Finally, every program is threatened constantly by software patents.\n         States should not allow patents to restrict development and use of\n         software on general-purpose computers, but in those that do, we wish to\n         avoid the special danger that patents applied to a free program could\n         make it effectively proprietary.  To prevent this, the GPL assures that\n         patents cannot be used to render the program non-free.\n         \n           The precise terms and conditions for copying, distribution and\n         modification follow.\n         \n                                TERMS AND CONDITIONS\n         \n           0. Definitions.\n         \n           "This License" refers to version 3 of the GNU General Public License.\n         \n           "Copyright" also means copyright-like laws that apply to other kinds of\n         works, such as semiconductor masks.\n         \n           "The Program" refers to any copyrightable work licensed under this\n         License.  Each licensee is addressed as "you".  "Licensees" and\n         "recipients" may be individuals or organizations.\n         \n           To "modify" a work means to copy from or adapt all or part of the work\n         in a fashion requiring copyright permission, other than the making of an\n         exact copy.  The resulting work is called a "modified version" of the\n         earlier work or a work "based on" the earlier work.\n         \n           A "covered work" means either the unmodified Program or a work based\n         on the Program.\n         \n           To "propagate" a work means to do anything with it that, without\n         permission, would make you directly or secondarily liable for\n         infringement under applicable copyright law, except executing it on a\n         computer or modifying a private copy.  Propagation includes copying,\n         distribution (with or without modification), making available to the\n         public, and in some countries other activities as well.\n         \n           To "convey" a work means any kind of propagation that enables other\n         parties to make or receive copies.  Mere interaction with a user through\n         a computer network, with no transfer of a copy, is not conveying.\n         \n           An interactive user interface displays "Appropriate Legal Notices"\n         to the extent that it includes a convenient and prominently visible\n         feature that (1) displays an appropriate copyright notice, and (2)\n         tells the user that there is no warranty for the work (except to the\n         extent that warranties are provided), that licensees may convey the\n         work under this License, and how to view a copy of this License.  If\n         the interface presents a list of user commands or options, such as a\n         menu, a prominent item in the list meets this criterion.\n         \n           1. Source Code.\n         \n           The "source code" for a work means the preferred form of the work\n         for making modifications to it.  "Object code" means any non-source\n         form of a work.\n         \n           A "Standard Interface" means an interface that either is an official\n         standard defined by a recognized standards body, or, in the case of\n         interfaces specified for a particular programming language, one that\n         is widely used among developers working in that language.\n         \n           The "System Libraries" of an executable work include anything, other\n         than the work as a whole, that (a) is included in the normal form of\n         packaging a Major Component, but which is not part of that Major\n         Component, and (b) serves only to enable use of the work with that\n         Major Component, or to implement a Standard Interface for which an\n         implementation is available to the public in source code form.  A\n         "Major Component", in this context, means a major essential component\n         (kernel, window system, and so on) of the specific operating system\n         (if any) on which the executable work runs, or a compiler used to\n         produce the work, or an object code interpreter used to run it.\n         \n           The "Corresponding Source" for a work in object code form means all\n         the source code needed to generate, install, and (for an executable\n         work) run the object code and to modify the work, including scripts to\n         control those activities.  However, it does not include the work\'s\n         System Libraries, or general-purpose tools or generally available free\n         programs which are used unmodified in performing those activities but\n         which are not part of the work.  For example, Corresponding Source\n         includes interface definition files associated with source files for\n         the work, and the source code for shared libraries and dynamically\n         linked subprograms that the work is specifically designed to require,\n         such as by intimate data communication or control flow between those\n         subprograms and other parts of the work.\n         \n           The Corresponding Source need not include anything that users\n         can regenerate automatically from other parts of the Corresponding\n         Source.\n         \n           The Corresponding Source for a work in source code form is that\n         same work.\n         \n           2. Basic Permissions.\n         \n           All rights granted under this License are granted for the term of\n         copyright on the Program, and are irrevocable provided the stated\n         conditions are met.  This License explicitly affirms your unlimited\n         permission to run the unmodified Program.  The output from running a\n         covered work is covered by this License only if the output, given its\n         content, constitutes a covered work.  This License acknowledges your\n         rights of fair use or other equivalent, as provided by copyright law.\n         \n           You may make, run and propagate covered works that you do not\n         convey, without conditions so long as your license otherwise remains\n         in force.  You may convey covered works to others for the sole purpose\n         of having them make modifications exclusively for you, or provide you\n         with facilities for running those works, provided that you comply with\n         the terms of this License in conveying all material for which you do\n         not control copyright.  Those thus making or running the covered works\n         for you must do so exclusively on your behalf, under your direction\n         and control, on terms that prohibit them from making any copies of\n         your copyrighted material outside their relationship with you.\n         \n           Conveying under any other circumstances is permitted solely under\n         the conditions stated below.  Sublicensing is not allowed; section 10\n         makes it unnecessary.\n         \n           3. Protecting Users\' Legal Rights From Anti-Circumvention Law.\n         \n           No covered work shall be deemed part of an effective technological\n         measure under any applicable law fulfilling obligations under article\n         11 of the WIPO copyright treaty adopted on 20 December 1996, or\n         similar laws prohibiting or restricting circumvention of such\n         measures.\n         \n           When you convey a covered work, you waive any legal power to forbid\n         circumvention of technological measures to the extent such circumvention\n         is effected by exercising rights under this License with respect to\n         the covered work, and you disclaim any intention to limit operation or\n         modification of the work as a means of enforcing, against the work\'s\n         users, your or third parties\' legal rights to forbid circumvention of\n         technological measures.\n         \n           4. Conveying Verbatim Copies.\n         \n           You may convey verbatim copies of the Program\'s source code as you\n         receive it, in any medium, provided that you conspicuously and\n         appropriately publish on each copy an appropriate copyright notice;\n         keep intact all notices stating that this License and any\n         non-permissive terms added in accord with section 7 apply to the code;\n         keep intact all notices of the absence of any warranty; and give all\n         recipients a copy of this License along with the Program.\n         \n           You may charge any price or no price for each copy that you convey,\n         and you may offer support or warranty protection for a fee.\n         \n           5. Conveying Modified Source Versions.\n         \n           You may convey a work based on the Program, or the modifications to\n         produce it from the Program, in the form of source code under the\n         terms of section 4, provided that you also meet all of these conditions:\n         \n             a) The work must carry prominent notices stating that you modified\n             it, and giving a relevant date.\n         \n             b) The work must carry prominent notices stating that it is\n             released under this License and any conditions added under section\n             7.  This requirement modifies the requirement in section 4 to\n             "keep intact all notices".\n         \n             c) You must license the entire work, as a whole, under this\n             License to anyone who comes into possession of a copy.  This\n             License will therefore apply, along with any applicable section 7\n             additional terms, to the whole of the work, and all its parts,\n             regardless of how they are packaged.  This License gives no\n             permission to license the work in any other way, but it does not\n             invalidate such permission if you have separately received it.\n         \n             d) If the work has interactive user interfaces, each must display\n             Appropriate Legal Notices; however, if the Program has interactive\n             interfaces that do not display Appropriate Legal Notices, your\n             work need not make them do so.\n         \n           A compilation of a covered work with other separate and independent\n         works, which are not by their nature extensions of the covered work,\n         and which are not combined with it such as to form a larger program,\n         in or on a volume of a storage or distribution medium, is called an\n         "aggregate" if the compilation and its resulting copyright are not\n         used to limit the access or legal rights of the compilation\'s users\n         beyond what the individual works permit.  Inclusion of a covered work\n         in an aggregate does not cause this License to apply to the other\n         parts of the aggregate.\n         \n           6. Conveying Non-Source Forms.\n         \n           You may convey a covered work in object code form under the terms\n         of sections 4 and 5, provided that you also convey the\n         machine-readable Corresponding Source under the terms of this License,\n         in one of these ways:\n         \n             a) Convey the object code in, or embodied in, a physical product\n             (including a physical distribution medium), accompanied by the\n             Corresponding Source fixed on a durable physical medium\n             customarily used for software interchange.\n         \n             b) Convey the object code in, or embodied in, a physical product\n             (including a physical distribution medium), accompanied by a\n             written offer, valid for at least three years and valid for as\n             long as you offer spare parts or customer support for that product\n             model, to give anyone who possesses the object code either (1) a\n             copy of the Corresponding Source for all the software in the\n             product that is covered by this License, on a durable physical\n             medium customarily used for software interchange, for a price no\n             more than your reasonable cost of physically performing this\n             conveying of source, or (2) access to copy the\n             Corresponding Source from a network server at no charge.\n         \n             c) Convey individual copies of the object code with a copy of the\n             written offer to provide the Corresponding Source.  This\n             alternative is allowed only occasionally and noncommercially, and\n             only if you received the object code with such an offer, in accord\n             with subsection 6b.\n         \n             d) Convey the object code by offering access from a designated\n             place (gratis or for a charge), and offer equivalent access to the\n             Corresponding Source in the same way through the same place at no\n             further charge.  You need not require recipients to copy the\n             Corresponding Source along with the object code.  If the place to\n             copy the object code is a network server, the Corresponding Source\n             may be on a different server (operated by you or a third party)\n             that supports equivalent copying facilities, provided you maintain\n             clear directions next to the object code saying where to find the\n             Corresponding Source.  Regardless of what server hosts the\n             Corresponding Source, you remain obligated to ensure that it is\n             available for as long as needed to satisfy these requirements.\n         \n             e) Convey the object code using peer-to-peer transmission, provided\n             you inform other peers where the object code and Corresponding\n             Source of the work are being offered to the general public at no\n             charge under subsection 6d.\n         \n           A separable portion of the object code, whose source code is excluded\n         from the Corresponding Source as a System Library, need not be\n         included in conveying the object code work.\n         \n           A "User Product" is either (1) a "consumer product", which means any\n         tangible personal property which is normally used for personal, family,\n         or household purposes, or (2) anything designed or sold for incorporation\n         into a dwelling.  In determining whether a product is a consumer product,\n         doubtful cases shall be resolved in favor of coverage.  For a particular\n         product received by a particular user, "normally used" refers to a\n         typical or common use of that class of product, regardless of the status\n         of the particular user or of the way in which the particular user\n         actually uses, or expects or is expected to use, the product.  A product\n         is a consumer product regardless of whether the product has substantial\n         commercial, industrial or non-consumer uses, unless such uses represent\n         the only significant mode of use of the product.\n         \n           "Installation Information" for a User Product means any methods,\n         procedures, authorization keys, or other information required to install\n         and execute modified versions of a covered work in that User Product from\n         a modified version of its Corresponding Source.  The information must\n         suffice to ensure that the continued functioning of the modified object\n         code is in no case prevented or interfered with solely because\n         modification has been made.\n         \n           If you convey an object code work under this section in, or with, or\n         specifically for use in, a User Product, and the conveying occurs as\n         part of a transaction in which the right of possession and use of the\n         User Product is transferred to the recipient in perpetuity or for a\n         fixed term (regardless of how the transaction is characterized), the\n         Corresponding Source conveyed under this section must be accompanied\n         by the Installation Information.  But this requirement does not apply\n         if neither you nor any third party retains the ability to install\n         modified object code on the User Product (for example, the work has\n         been installed in ROM).\n         \n           The requirement to provide Installation Information does not include a\n         requirement to continue to provide support service, warranty, or updates\n         for a work that has been modified or installed by the recipient, or for\n         the User Product in which it has been modified or installed.  Access to a\n         network may be denied when the modification itself materially and\n         adversely affects the operation of the network or violates the rules and\n         protocols for communication across the network.\n         \n           Corresponding Source conveyed, and Installation Information provided,\n         in accord with this section must be in a format that is publicly\n         documented (and with an implementation available to the public in\n         source code form), and must require no special password or key for\n         unpacking, reading or copying.\n         \n           7. Additional Terms.\n         \n           "Additional permissions" are terms that supplement the terms of this\n         License by making exceptions from one or more of its conditions.\n         Additional permissions that are applicable to the entire Program shall\n         be treated as though they were included in this License, to the extent\n         that they are valid under applicable law.  If additional permissions\n         apply only to part of the Program, that part may be used separately\n         under those permissions, but the entire Program remains governed by\n         this License without regard to the additional permissions.\n         \n           When you convey a copy of a covered work, you may at your option\n         remove any additional permissions from that copy, or from any part of\n         it.  (Additional permissions may be written to require their own\n         removal in certain cases when you modify the work.)  You may place\n         additional permissions on material, added by you to a covered work,\n         for which you have or can give appropriate copyright permission.\n         \n           Notwithstanding any other provision of this License, for material you\n         add to a covered work, you may (if authorized by the copyright holders of\n         that material) supplement the terms of this License with terms:\n         \n             a) Disclaiming warranty or limiting liability differently from the\n             terms of sections 15 and 16 of this License; or\n         \n             b) Requiring preservation of specified reasonable legal notices or\n             author attributions in that material or in the Appropriate Legal\n             Notices displayed by works containing it; or\n         \n             c) Prohibiting misrepresentation of the origin of that material, or\n             requiring that modified versions of such material be marked in\n             reasonable ways as different from the original version; or\n         \n             d) Limiting the use for publicity purposes of names of licensors or\n             authors of the material; or\n         \n             e) Declining to grant rights under trademark law for use of some\n             trade names, trademarks, or service marks; or\n         \n             f) Requiring indemnification of licensors and authors of that\n             material by anyone who conveys the material (or modified versions of\n             it) with contractual assumptions of liability to the recipient, for\n             any liability that these contractual assumptions directly impose on\n             those licensors and authors.\n         \n           All other non-permissive additional terms are considered "further\n         restrictions" within the meaning of section 10.  If the Program as you\n         received it, or any part of it, contains a notice stating that it is\n         governed by this License along with a term that is a further\n         restriction, you may remove that term.  If a license document contains\n         a further restriction but permits relicensing or conveying under this\n         License, you may add to a covered work material governed by the terms\n         of that license document, provided that the further restriction does\n         not survive such relicensing or conveying.\n         \n           If you add terms to a covered work in accord with this section, you\n         must place, in the relevant source files, a statement of the\n         additional terms that apply to those files, or a notice indicating\n         where to find the applicable terms.\n         \n           Additional terms, permissive or non-permissive, may be stated in the\n         form of a separately written license, or stated as exceptions;\n         the above requirements apply either way.\n         \n           8. Termination.\n         \n           You may not propagate or modify a covered work except as expressly\n         provided under this License.  Any attempt otherwise to propagate or\n         modify it is void, and will automatically terminate your rights under\n         this License (including any patent licenses granted under the third\n         paragraph of section 11).\n         \n           However, if you cease all violation of this License, then your\n         license from a particular copyright holder is reinstated (a)\n         provisionally, unless and until the copyright holder explicitly and\n         finally terminates your license, and (b) permanently, if the copyright\n         holder fails to notify you of the violation by some reasonable means\n         prior to 60 days after the cessation.\n         \n           Moreover, your license from a particular copyright holder is\n         reinstated permanently if the copyright holder notifies you of the\n         violation by some reasonable means, this is the first time you have\n         received notice of violation of this License (for any work) from that\n         copyright holder, and you cure the violation prior to 30 days after\n         your receipt of the notice.\n         \n           Termination of your rights under this section does not terminate the\n         licenses of parties who have received copies or rights from you under\n         this License.  If your rights have been terminated and not permanently\n         reinstated, you do not qualify to receive new licenses for the same\n         material under section 10.\n         \n           9. Acceptance Not Required for Having Copies.\n         \n           You are not required to accept this License in order to receive or\n         run a copy of the Program.  Ancillary propagation of a covered work\n         occurring solely as a consequence of using peer-to-peer transmission\n         to receive a copy likewise does not require acceptance.  However,\n         nothing other than this License grants you permission to propagate or\n         modify any covered work.  These actions infringe copyright if you do\n         not accept this License.  Therefore, by modifying or propagating a\n         covered work, you indicate your acceptance of this License to do so.\n         \n           10. Automatic Licensing of Downstream Recipients.\n         \n           Each time you convey a covered work, the recipient automatically\n         receives a license from the original licensors, to run, modify and\n         propagate that work, subject to this License.  You are not responsible\n         for enforcing compliance by third parties with this License.\n         \n           An "entity transaction" is a transaction transferring control of an\n         organization, or substantially all assets of one, or subdividing an\n         organization, or merging organizations.  If propagation of a covered\n         work results from an entity transaction, each party to that\n         transaction who receives a copy of the work also receives whatever\n         licenses to the work the party\'s predecessor in interest had or could\n         give under the previous paragraph, plus a right to possession of the\n         Corresponding Source of the work from the predecessor in interest, if\n         the predecessor has it or can get it with reasonable efforts.\n         \n           You may not impose any further restrictions on the exercise of the\n         rights granted or affirmed under this License.  For example, you may\n         not impose a license fee, royalty, or other charge for exercise of\n         rights granted under this License, and you may not initiate litigation\n         (including a cross-claim or counterclaim in a lawsuit) alleging that\n         any patent claim is infringed by making, using, selling, offering for\n         sale, or importing the Program or any portion of it.\n         \n           11. Patents.\n         \n           A "contributor" is a copyright holder who authorizes use under this\n         License of the Program or a work on which the Program is based.  The\n         work thus licensed is called the contributor\'s "contributor version".\n         \n           A contributor\'s "essential patent claims" are all patent claims\n         owned or controlled by the contributor, whether already acquired or\n         hereafter acquired, that would be infringed by some manner, permitted\n         by this License, of making, using, or selling its contributor version,\n         but do not include claims that would be infringed only as a\n         consequence of further modification of the contributor version.  For\n         purposes of this definition, "control" includes the right to grant\n         patent sublicenses in a manner consistent with the requirements of\n         this License.\n         \n           Each contributor grants you a non-exclusive, worldwide, royalty-free\n         patent license under the contributor\'s essential patent claims, to\n         make, use, sell, offer for sale, import and otherwise run, modify and\n         propagate the contents of its contributor version.\n         \n           In the following three paragraphs, a "patent license" is any express\n         agreement or commitment, however denominated, not to enforce a patent\n         (such as an express permission to practice a patent or covenant not to\n         sue for patent infringement).  To "grant" such a patent license to a\n         party means to make such an agreement or commitment not to enforce a\n         patent against the party.\n         \n           If you convey a covered work, knowingly relying on a patent license,\n         and the Corresponding Source of the work is not available for anyone\n         to copy, free of charge and under the terms of this License, through a\n         publicly available network server or other readily accessible means,\n         then you must either (1) cause the Corresponding Source to be so\n         available, or (2) arrange to deprive yourself of the benefit of the\n         patent license for this particular work, or (3) arrange, in a manner\n         consistent with the requirements of this License, to extend the patent\n         license to downstream recipients.  "Knowingly relying" means you have\n         actual knowledge that, but for the patent license, your conveying the\n         covered work in a country, or your recipient\'s use of the covered work\n         in a country, would infringe one or more identifiable patents in that\n         country that you have reason to believe are valid.\n         \n           If, pursuant to or in connection with a single transaction or\n         arrangement, you convey, or propagate by procuring conveyance of, a\n         covered work, and grant a patent license to some of the parties\n         receiving the covered work authorizing them to use, propagate, modify\n         or convey a specific copy of the covered work, then the patent license\n         you grant is automatically extended to all recipients of the covered\n         work and works based on it.\n         \n           A patent license is "discriminatory" if it does not include within\n         the scope of its coverage, prohibits the exercise of, or is\n         conditioned on the non-exercise of one or more of the rights that are\n         specifically granted under this License.  You may not convey a covered\n         work if you are a party to an arrangement with a third party that is\n         in the business of distributing software, under which you make payment\n         to the third party based on the extent of your activity of conveying\n         the work, and under which the third party grants, to any of the\n         parties who would receive the covered work from you, a discriminatory\n         patent license (a) in connection with copies of the covered work\n         conveyed by you (or copies made from those copies), or (b) primarily\n         for and in connection with specific products or compilations that\n         contain the covered work, unless you entered into that arrangement,\n         or that patent license was granted, prior to 28 March 2007.\n         \n           Nothing in this License shall be construed as excluding or limiting\n         any implied license or other defenses to infringement that may\n         otherwise be available to you under applicable patent law.\n         \n           12. No Surrender of Others\' Freedom.\n         \n           If conditions are imposed on you (whether by court order, agreement or\n         otherwise) that contradict the conditions of this License, they do not\n         excuse you from the conditions of this License.  If you cannot convey a\n         covered work so as to satisfy simultaneously your obligations under this\n         License and any other pertinent obligations, then as a consequence you may\n         not convey it at all.  For example, if you agree to terms that obligate you\n         to collect a royalty for further conveying from those to whom you convey\n         the Program, the only way you could satisfy both those terms and this\n         License would be to refrain entirely from conveying the Program.\n         \n           13. Use with the GNU Affero General Public License.\n         \n           Notwithstanding any other provision of this License, you have\n         permission to link or combine any covered work with a work licensed\n         under version 3 of the GNU Affero General Public License into a single\n         combined work, and to convey the resulting work.  The terms of this\n         License will continue to apply to the part which is the covered work,\n         but the special requirements of the GNU Affero General Public License,\n         section 13, concerning interaction through a network will apply to the\n         combination as such.\n         \n           14. Revised Versions of this License.\n         \n           The Free Software Foundation may publish revised and/or new versions of\n         the GNU General Public License from time to time.  Such new versions will\n         be similar in spirit to the present version, but may differ in detail to\n         address new problems or concerns.\n         \n           Each version is given a distinguishing version number.  If the\n         Program specifies that a certain numbered version of the GNU General\n         Public License "or any later version" applies to it, you have the\n         option of following the terms and conditions either of that numbered\n         version or of any later version published by the Free Software\n         Foundation.  If the Program does not specify a version number of the\n         GNU General Public License, you may choose any version ever published\n         by the Free Software Foundation.\n         \n           If the Program specifies that a proxy can decide which future\n         versions of the GNU General Public License can be used, that proxy\'s\n         public statement of acceptance of a version permanently authorizes you\n         to choose that version for the Program.\n         \n           Later license versions may give you additional or different\n         permissions.  However, no additional obligations are imposed on any\n         author or copyright holder as a result of your choosing to follow a\n         later version.\n         \n           15. Disclaimer of Warranty.\n         \n           THERE IS NO WARRANTY FOR THE PROGRAM, TO THE EXTENT PERMITTED BY\n         APPLICABLE LAW.  EXCEPT WHEN OTHERWISE STATED IN WRITING THE COPYRIGHT\n         HOLDERS AND/OR OTHER PARTIES PROVIDE THE PROGRAM "AS IS" WITHOUT WARRANTY\n         OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, BUT NOT LIMITED TO,\n         THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR\n         PURPOSE.  THE ENTIRE RISK AS TO THE QUALITY AND PERFORMANCE OF THE PROGRAM\n         IS WITH YOU.  SHOULD THE PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF\n         ALL NECESSARY SERVICING, REPAIR OR CORRECTION.\n         \n           16. Limitation of Liability.\n         \n           IN NO EVENT UNLESS REQUIRED BY APPLICABLE LAW OR AGREED TO IN WRITING\n         WILL ANY COPYRIGHT HOLDER, OR ANY OTHER PARTY WHO MODIFIES AND/OR CONVEYS\n         THE PROGRAM AS PERMITTED ABOVE, BE LIABLE TO YOU FOR DAMAGES, INCLUDING ANY\n         GENERAL, SPECIAL, INCIDENTAL OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE\n         USE OR INABILITY TO USE THE PROGRAM (INCLUDING BUT NOT LIMITED TO LOSS OF\n         DATA OR DATA BEING RENDERED INACCURATE OR LOSSES SUSTAINED BY YOU OR THIRD\n         PARTIES OR A FAILURE OF THE PROGRAM TO OPERATE WITH ANY OTHER PROGRAMS),\n         EVEN IF SUCH HOLDER OR OTHER PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF\n         SUCH DAMAGES.\n         \n           17. Interpretation of Sections 15 and 16.\n         \n           If the disclaimer of warranty and limitation of liability provided\n         above cannot be given local legal effect according to their terms,\n         reviewing courts shall apply local law that most closely approximates\n         an absolute waiver of all civil liability in connection with the\n         Program, unless a warranty or assumption of liability accompanies a\n         copy of the Program in return for a fee.\n         \n                              END OF TERMS AND CONDITIONS\n         \n                     How to Apply These Terms to Your New Programs\n         \n           If you develop a new program, and you want it to be of the greatest\n         possible use to the public, the best way to achieve this is to make it\n         free software which everyone can redistribute and change under these terms.\n         \n           To do so, attach the following notices to the program.  It is safest\n         to attach them to the start of each source file to most effectively\n         state the exclusion of warranty; and each file should have at least\n         the "copyright" line and a pointer to where the full notice is found.\n         \n             <one line to give the program\'s name and a brief idea of what it does.>\n             Copyright (C) <year>  <name of author>\n         \n             This program is free software: you can redistribute it and/or modify\n             it under the terms of the GNU General Public License as published by\n             the Free Software Foundation, either version 3 of the License, or\n             (at your option) any later version.\n         \n             This program is distributed in the hope that it will be useful,\n             but WITHOUT ANY WARRANTY; without even the implied warranty of\n             MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n             GNU General Public License for more details.\n         \n             You should have received a copy of the GNU General Public License\n             along with this program.  If not, see <http://www.gnu.org/licenses/>.\n         \n         Also add information on how to contact you by electronic and paper mail.\n         \n           If the program does terminal interaction, make it output a short\n         notice like this when it starts in an interactive mode:\n         \n             <program>  Copyright (C) <year>  <name of author>\n             This program comes with ABSOLUTELY NO WARRANTY; for details type `show w\'.\n             This is free software, and you are welcome to redistribute it\n             under certain conditions; type `show c\' for details.\n         \n         The hypothetical commands `show w\' and `show c\' should show the appropriate\n         parts of the General Public License.  Of course, your program\'s commands\n         might be different; for a GUI interface, you would use an "about box".\n         \n           You should also get your employer (if you work as a programmer) or school,\n         if any, to sign a "copyright disclaimer" for the program, if necessary.\n         For more information on this, and how to apply and follow the GNU GPL, see\n         <http://www.gnu.org/licenses/>.\n         \n           The GNU General Public License does not permit incorporating your program\n         into proprietary programs.  If your program is a subroutine library, you\n         may consider it more useful to permit linking proprietary applications with\n         the library.  If this is what you want to do, use the GNU Lesser General\n         Public License instead of this License.  But first, please read\n         <http://www.gnu.org/philosophy/why-not-lgpl.html>.\n         \n         \n         Name: libquadmath\n         Files: scipy/.dylibs/libquadmath*.so\n         Description: dynamically linked to files compiled with gcc\n         Availability: https://gcc.gnu.org/git/?p=gcc.git;a=tree;f=libquadmath\n         License: LGPL-2.1-or-later\n         \n             GCC Quad-Precision Math Library\n             Copyright (C) 2010-2019 Free Software Foundation, Inc.\n             Written by Francois-Xavier Coudert  <fxcoudert@gcc.gnu.org>\n         \n             This file is part of the libquadmath library.\n             Libquadmath is free software; you can redistribute it and/or\n             modify it under the terms of the GNU Library General Public\n             License as published by the Free Software Foundation; either\n             version 2.1 of the License, or (at your option) any later version.\n         \n             Libquadmath is distributed in the hope that it will be useful,\n             but WITHOUT ANY WARRANTY; without even the implied warranty of\n             MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU\n             Lesser General Public License for more details.\n             https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html\n         ',
  metadata_version: "",
  name: "scipy",
  platform: "",
  summary: "Fundamental algorithms for scientific computing in Python",
  version: "1.9.0rc2",
  classifiers:
    '["Development Status :: 5 - Production/Stable", "Intended Audience :: Developers", "Intended Audience :: Science/Research", "License :: OSI Approved :: BSD License", "Operating System :: MacOS", "Operating System :: Microsoft :: Windows", "Operating System :: POSIX", "Operating System :: POSIX :: Linux", "Operating System :: Unix", "Programming Language :: C", "Programming Language :: Python", "Programming Language :: Python :: 3", "Programming Language :: Python :: 3.11", "Programming Language :: Python :: 3.12", "Programming Language :: Python :: 3.13", "Programming Language :: Python :: 3.14", "Topic :: Scientific/Engineering", "Topic :: Software Development :: Libraries"]',
  download_url: "",
  supported_platform: "",
  maintainer: "",
  maintainer_email: "SciPy Developers <scipy-dev@python.org>",
  obsoletes_dist: "[]",
  project_url: "https://pypi.org/project/scipy/",
  project_urls:
    '{"documentation": "https://docs.scipy.org/doc/scipy/", "download": "https://github.com/scipy/scipy/releases", "homepage": "https://scipy.org/", "source": "https://github.com/scipy/scipy", "tracker": "https://github.com/scipy/scipy/issues"}',
  provides_dist: "[]",
  requires_external: "[]",
  requires_dist:
    '["numpy<2.7,>=1.26.4", "pytest>=8.0.0; extra == \\"test\\"", "pytest-cov; extra == \\"test\\"", "pytest-timeout; extra == \\"test\\"", "pytest-xdist; extra == \\"test\\"", "asv; extra == \\"test\\"", "mpmath; extra == \\"test\\"", "gmpy2; extra == \\"test\\"", "threadpoolctl; extra == \\"test\\"", "scikit-umfpack; extra == \\"test\\"", "pooch; extra == \\"test\\"", "hypothesis>=6.30; extra == \\"test\\"", "array-api-strict>=2.3.1; extra == \\"test\\"", "Cython; extra == \\"test\\"", "meson; extra == \\"test\\"", "ninja; sys_platform != \\"emscripten\\" and extra == \\"test\\"", "sphinx<8.2.0,>=5.0.0; extra == \\"doc\\"", "intersphinx_registry; extra == \\"doc\\"", "pydata-sphinx-theme>=0.15.2; extra == \\"doc\\"", "sphinx-copybutton; extra == \\"doc\\"", "sphinx-design>=0.4.0; extra == \\"doc\\"", "matplotlib>=3.5; extra == \\"doc\\"", "numpydoc; extra == \\"doc\\"", "jupytext; extra == \\"doc\\"", "myst-nb>=1.2.0; extra == \\"doc\\"", "pooch; extra == \\"doc\\"", "jupyterlite-sphinx>=0.19.1; extra == \\"doc\\"", "jupyterlite-pyodide-kernel; extra == \\"doc\\"", "linkify-it-py; extra == \\"doc\\"", "tabulate; extra == \\"doc\\"", "click<8.3.0; extra == \\"dev\\"", "spin; extra == \\"dev\\"", "mypy==1.10.0; extra == \\"dev\\"", "typing_extensions; extra == \\"dev\\"", "types-psutil; extra == \\"dev\\"", "pycodestyle; extra == \\"dev\\"", "ruff>=0.12.0; extra == \\"dev\\"", "cython-lint>=0.12.2; extra == \\"dev\\""]',
  requires_python: ">=3.8,<3.12",
  description_content_type: "text/x-rst",
  provides_extras: "[]",
  dynamic: "null",
  license_expression: "",
  license_file: "[]",
  filename:
    "scipy-1.9.0rc2-cp38-cp38-manylinux_2_17_aarch64.manylinux2014_aarch64.whl",
  packagetype: "bdist_wheel",
  python_version: "cp38",
  size: 40337036,
  sha256: "fff9ba39ab63f0b00953d726ba349113c6e542e89676d2661d2c95eadfaeb6a9",
  metadata_sha256:
    "84d0b674cc29fcb1627776c02a0afc4ec712bb338140f9ad0785817f9446c200",
  provenance: undefined,
};

export const uniquePackagesMock: UniquePackageResponse = {
  meta: {
    "api-version": "1.1",
    "_last-serial": 1000000000,
  },
  projects: [
    {
      name: "accelerate",
      "_last-serial": 1000000000,
    },
    {
      name: "aiobotocore",
      "_last-serial": 1000000000,
    },
    {
      name: "aiohappyeyeballs",
      "_last-serial": 1000000000,
    },
    {
      name: "aiohttp",
      "_last-serial": 1000000000,
    },
    {
      name: "aioitertools",
      "_last-serial": 1000000000,
    },
    {
      name: "aiosignal",
      "_last-serial": 1000000000,
    },
    {
      name: "aiosqlite",
      "_last-serial": 1000000000,
    },
    {
      name: "alabaster",
      "_last-serial": 1000000000,
    },
    {
      name: "altgraph",
      "_last-serial": 1000000000,
    },
    {
      name: "annotated-doc",
      "_last-serial": 1000000000,
    },
    {
      name: "annotated-types",
      "_last-serial": 1000000000,
    },
    {
      name: "anyio",
      "_last-serial": 1000000000,
    },
    {
      name: "appdirs",
      "_last-serial": 1000000000,
    },
    {
      name: "APScheduler",
      "_last-serial": 1000000000,
    },
    {
      name: "argon2-cffi",
      "_last-serial": 1000000000,
    },
    {
      name: "argon2-cffi-bindings",
      "_last-serial": 1000000000,
    },
    {
      name: "arrow",
      "_last-serial": 1000000000,
    },
    {
      name: "asttokens",
      "_last-serial": 1000000000,
    },
    {
      name: "astunparse",
      "_last-serial": 1000000000,
    },
    {
      name: "async-lru",
      "_last-serial": 1000000000,
    },
    {
      name: "asyncpg",
      "_last-serial": 1000000000,
    },
    {
      name: "attrs",
      "_last-serial": 1000000000,
    },
    {
      name: "autoevals",
      "_last-serial": 1000000000,
    },
    {
      name: "azure-core",
      "_last-serial": 1000000000,
    },
    {
      name: "azure-identity",
      "_last-serial": 1000000000,
    },
    {
      name: "azure-storage-blob",
      "_last-serial": 1000000000,
    },
    {
      name: "babel",
      "_last-serial": 1000000000,
    },
    {
      name: "backoff",
      "_last-serial": 1000000000,
    },
    {
      name: "bashlex",
      "_last-serial": 1000000000,
    },
    {
      name: "beautifulsoup4",
      "_last-serial": 1000000000,
    },
    {
      name: "beniget",
      "_last-serial": 1000000000,
    },
    {
      name: "bigtree",
      "_last-serial": 1000000000,
    },
    {
      name: "bleach",
      "_last-serial": 1000000000,
    },
    {
      name: "blis",
      "_last-serial": 1000000000,
    },
    {
      name: "boto3",
      "_last-serial": 1000000000,
    },
    {
      name: "botocore",
      "_last-serial": 1000000000,
    },
    {
      name: "bracex",
      "_last-serial": 1000000000,
    },
    {
      name: "build",
      "_last-serial": 1000000000,
    },
    {
      name: "cachetools",
      "_last-serial": 1000000000,
    },
    {
      name: "calver",
      "_last-serial": 1000000000,
    },
    {
      name: "catalogue",
      "_last-serial": 1000000000,
    },
    {
      name: "certifi",
      "_last-serial": 1000000000,
    },
    {
      name: "cffi",
      "_last-serial": 1000000000,
    },
    {
      name: "chardet",
      "_last-serial": 1000000000,
    },
    {
      name: "charset-normalizer",
      "_last-serial": 1000000000,
    },
    {
      name: "chevron",
      "_last-serial": 1000000000,
    },
    {
      name: "cibuildwheel",
      "_last-serial": 1000000000,
    },
    {
      name: "click",
      "_last-serial": 1000000000,
    },
    {
      name: "cloudpathlib",
      "_last-serial": 1000000000,
    },
    {
      name: "cloudpickle",
      "_last-serial": 1000000000,
    },
    {
      name: "cmake",
      "_last-serial": 1000000000,
    },
    {
      name: "coherent.licensed",
      "_last-serial": 1000000000,
    },
    {
      name: "colorama",
      "_last-serial": 1000000000,
    },
    {
      name: "comm",
      "_last-serial": 1000000000,
    },
    {
      name: "confection",
      "_last-serial": 1000000000,
    },
    {
      name: "contourpy",
      "_last-serial": 1000000000,
    },
    {
      name: "cppy",
      "_last-serial": 1000000000,
    },
    {
      name: "croniter",
      "_last-serial": 1000000000,
    },
    {
      name: "cryptography",
      "_last-serial": 1000000000,
    },
    {
      name: "cycler",
      "_last-serial": 1000000000,
    },
    {
      name: "cymem",
      "_last-serial": 1000000000,
    },
    {
      name: "Cython",
      "_last-serial": 1000000000,
    },
    {
      name: "dask",
      "_last-serial": 1000000000,
    },
    {
      name: "dataclasses-json",
      "_last-serial": 1000000000,
    },
    {
      name: "datasets",
      "_last-serial": 1000000000,
    },
    {
      name: "debugpy",
      "_last-serial": 1000000000,
    },
    {
      name: "decorator",
      "_last-serial": 1000000000,
    },
    {
      name: "defusedxml",
      "_last-serial": 1000000000,
    },
    {
      name: "delocate",
      "_last-serial": 1000000000,
    },
    {
      name: "dependency-groups",
      "_last-serial": 1000000000,
    },
    {
      name: "deprecation",
      "_last-serial": 1000000000,
    },
    {
      name: "dill",
      "_last-serial": 1000000000,
    },
    {
      name: "diskcache",
      "_last-serial": 1000000000,
    },
    {
      name: "distro",
      "_last-serial": 1000000000,
    },
    {
      name: "dnspython",
      "_last-serial": 1000000000,
    },
    {
      name: "docling",
      "_last-serial": 1000000000,
    },
    {
      name: "docling-core",
      "_last-serial": 1000000000,
    },
    {
      name: "docling-ibm-models",
      "_last-serial": 1000000000,
    },
    {
      name: "docling-parse",
      "_last-serial": 1000000000,
    },
    {
      name: "docstring_parser",
      "_last-serial": 1000000000,
    },
    {
      name: "docutils",
      "_last-serial": 1000000000,
    },
    {
      name: "dunamai",
      "_last-serial": 1000000000,
    },
    {
      name: "durationpy",
      "_last-serial": 1000000000,
    },
    {
      name: "einops",
      "_last-serial": 1000000000,
    },
    {
      name: "email-validator",
      "_last-serial": 1000000000,
    },
    {
      name: "et_xmlfile",
      "_last-serial": 1000000000,
    },
    {
      name: "executing",
      "_last-serial": 1000000000,
    },
    {
      name: "expandvars",
      "_last-serial": 1000000000,
    },
    {
      name: "faiss-cpu",
      "_last-serial": 1000000000,
    },
    {
      name: "Faker",
      "_last-serial": 1000000000,
    },
    {
      name: "fastapi",
      "_last-serial": 1000000000,
    },
    {
      name: "fastapi-sso",
      "_last-serial": 1000000000,
    },
    {
      name: "fastjsonschema",
      "_last-serial": 1000000000,
    },
    {
      name: "feast",
      "_last-serial": 1000000000,
    },
    {
      name: "filelock",
      "_last-serial": 1000000000,
    },
    {
      name: "filetype",
      "_last-serial": 1000000000,
    },
    {
      name: "fire",
      "_last-serial": 1000000000,
    },
    {
      name: "flit_core",
      "_last-serial": 1000000000,
    },
    {
      name: "fonttools",
      "_last-serial": 1000000000,
    },
    {
      name: "fqdn",
      "_last-serial": 1000000000,
    },
    {
      name: "frozenlist",
      "_last-serial": 1000000000,
    },
    {
      name: "fsspec",
      "_last-serial": 1000000000,
    },
    {
      name: "gast",
      "_last-serial": 1000000000,
    },
    {
      name: "gitdb",
      "_last-serial": 1000000000,
    },
    {
      name: "GitPython",
      "_last-serial": 1000000000,
    },
    {
      name: "google-api-core",
      "_last-serial": 1000000000,
    },
    {
      name: "googleapis-common-protos",
      "_last-serial": 1000000000,
    },
    {
      name: "google-auth",
      "_last-serial": 1000000000,
    },
    {
      name: "google-cloud-aiplatform",
      "_last-serial": 1000000000,
    },
    {
      name: "google-cloud-bigquery",
      "_last-serial": 1000000000,
    },
    {
      name: "google-cloud-core",
      "_last-serial": 1000000000,
    },
    {
      name: "google-cloud-resource-manager",
      "_last-serial": 1000000000,
    },
    {
      name: "google-cloud-storage",
      "_last-serial": 1000000000,
    },
    {
      name: "google-crc32c",
      "_last-serial": 1000000000,
    },
    {
      name: "google-genai",
      "_last-serial": 1000000000,
    },
    {
      name: "google-resumable-media",
      "_last-serial": 1000000000,
    },
    {
      name: "greenlet",
      "_last-serial": 1000000000,
    },
    {
      name: "grpc-google-iam-v1",
      "_last-serial": 1000000000,
    },
    {
      name: "grpcio",
      "_last-serial": 1000000000,
    },
    {
      name: "grpcio-status",
      "_last-serial": 1000000000,
    },
    {
      name: "gunicorn",
      "_last-serial": 1000000000,
    },
    {
      name: "h11",
      "_last-serial": 1000000000,
    },
    {
      name: "hatch-fancy-pypi-readme",
      "_last-serial": 1000000000,
    },
    {
      name: "hatch-jupyter-builder",
      "_last-serial": 1000000000,
    },
    {
      name: "hatchling",
      "_last-serial": 1000000000,
    },
    {
      name: "hatch-nodejs-version",
      "_last-serial": 1000000000,
    },
    {
      name: "hatch-requirements-txt",
      "_last-serial": 1000000000,
    },
    {
      name: "hatch-vcs",
      "_last-serial": 1000000000,
    },
    {
      name: "hf-xet",
      "_last-serial": 1000000000,
    },
    {
      name: "httpcore",
      "_last-serial": 1000000000,
    },
    {
      name: "httptools",
      "_last-serial": 1000000000,
    },
    {
      name: "httpx",
      "_last-serial": 1000000000,
    },
    {
      name: "httpx-sse",
      "_last-serial": 1000000000,
    },
    {
      name: "huggingface_hub",
      "_last-serial": 1000000000,
    },
    {
      name: "humanize",
      "_last-serial": 1000000000,
    },
    {
      name: "id",
      "_last-serial": 1000000000,
    },
    {
      name: "idna",
      "_last-serial": 1000000000,
    },
    {
      name: "imagesize",
      "_last-serial": 1000000000,
    },
    {
      name: "importlib_metadata",
      "_last-serial": 1000000000,
    },
    {
      name: "instructor",
      "_last-serial": 1000000000,
    },
    {
      name: "ipykernel",
      "_last-serial": 1000000000,
    },
    {
      name: "ipython",
      "_last-serial": 1000000000,
    },
    {
      name: "ipython_pygments_lexers",
      "_last-serial": 1000000000,
    },
    {
      name: "isodate",
      "_last-serial": 1000000000,
    },
    {
      name: "isoduration",
      "_last-serial": 1000000000,
    },
    {
      name: "its_hub",
      "_last-serial": 1000000000,
    },
    {
      name: "jaraco.classes",
      "_last-serial": 1000000000,
    },
    {
      name: "jaraco.context",
      "_last-serial": 1000000000,
    },
    {
      name: "jaraco.functools",
      "_last-serial": 1000000000,
    },
    {
      name: "jedi",
      "_last-serial": 1000000000,
    },
    {
      name: "jeepney",
      "_last-serial": 1000000000,
    },
    {
      name: "Jinja2",
      "_last-serial": 1000000000,
    },
    {
      name: "jiter",
      "_last-serial": 1000000000,
    },
    {
      name: "jmespath",
      "_last-serial": 1000000000,
    },
    {
      name: "joblib",
      "_last-serial": 1000000000,
    },
    {
      name: "json5",
      "_last-serial": 1000000000,
    },
    {
      name: "jsonlines",
      "_last-serial": 1000000000,
    },
    {
      name: "jsonpatch",
      "_last-serial": 1000000000,
    },
    {
      name: "jsonpointer",
      "_last-serial": 1000000000,
    },
    {
      name: "jsonref",
      "_last-serial": 1000000000,
    },
    {
      name: "jsonschema",
      "_last-serial": 1000000000,
    },
    {
      name: "jsonschema-specifications",
      "_last-serial": 1000000000,
    },
    {
      name: "jupyter_client",
      "_last-serial": 1000000000,
    },
    {
      name: "jupyter_core",
      "_last-serial": 1000000000,
    },
    {
      name: "jupyter-events",
      "_last-serial": 1000000000,
    },
    {
      name: "jupyterlab",
      "_last-serial": 1000000000,
    },
    {
      name: "jupyterlab_git",
      "_last-serial": 1000000000,
    },
    {
      name: "jupyterlab_pygments",
      "_last-serial": 1000000000,
    },
    {
      name: "jupyterlab_server",
      "_last-serial": 1000000000,
    },
    {
      name: "jupyter-lsp",
      "_last-serial": 1000000000,
    },
    {
      name: "jupyter_packaging",
      "_last-serial": 1000000000,
    },
    {
      name: "jupyter_server",
      "_last-serial": 1000000000,
    },
    {
      name: "jupyter-server-mathjax",
      "_last-serial": 1000000000,
    },
    {
      name: "jupyter_server_proxy",
      "_last-serial": 1000000000,
    },
    {
      name: "jupyter_server_terminals",
      "_last-serial": 1000000000,
    },
    {
      name: "keyring",
      "_last-serial": 1000000000,
    },
    {
      name: "kfp",
      "_last-serial": 1000000000,
    },
    {
      name: "kfp-kubernetes",
      "_last-serial": 1000000000,
    },
    {
      name: "kiwisolver",
      "_last-serial": 1000000000,
    },
    {
      name: "kubernetes",
      "_last-serial": 1000000000,
    },
    {
      name: "langchain",
      "_last-serial": 1000000000,
    },
    {
      name: "langchain-community",
      "_last-serial": 1000000000,
    },
    {
      name: "langchain-core",
      "_last-serial": 1000000000,
    },
    {
      name: "langchain-openai",
      "_last-serial": 1000000000,
    },
    {
      name: "langchain-text-splitters",
      "_last-serial": 1000000000,
    },
    {
      name: "langcodes",
      "_last-serial": 1000000000,
    },
    {
      name: "langsmith",
      "_last-serial": 1000000000,
    },
    {
      name: "language_data",
      "_last-serial": 1000000000,
    },
    {
      name: "lark",
      "_last-serial": 1000000000,
    },
    {
      name: "latex2mathml",
      "_last-serial": 1000000000,
    },
    {
      name: "litellm",
      "_last-serial": 1000000000,
    },
    {
      name: "litellm-enterprise",
      "_last-serial": 1000000000,
    },
    {
      name: "litellm-proxy-extras",
      "_last-serial": 1000000000,
    },
    {
      name: "llama_stack",
      "_last-serial": 1000000000,
    },
    {
      name: "llama_stack_client",
      "_last-serial": 1000000000,
    },
    {
      name: "llama-stack-provider-lmeval",
      "_last-serial": 1000000000,
    },
    {
      name: "llama-stack-provider-ragas",
      "_last-serial": 1000000000,
    },
    {
      name: "llama-stack-provider-trustyai-fms",
      "_last-serial": 1000000000,
    },
    {
      name: "locket",
      "_last-serial": 1000000000,
    },
    {
      name: "lxml",
      "_last-serial": 1000000000,
    },
    {
      name: "macholib",
      "_last-serial": 1000000000,
    },
    {
      name: "marisa-trie",
      "_last-serial": 1000000000,
    },
    {
      name: "markdown-it-py",
      "_last-serial": 1000000000,
    },
    {
      name: "marko",
      "_last-serial": 1000000000,
    },
    {
      name: "MarkupSafe",
      "_last-serial": 1000000000,
    },
    {
      name: "marshmallow",
      "_last-serial": 1000000000,
    },
    {
      name: "matplotlib",
      "_last-serial": 1000000000,
    },
    {
      name: "matplotlib-inline",
      "_last-serial": 1000000000,
    },
    {
      name: "maturin",
      "_last-serial": 1000000000,
    },
    {
      name: "mcp",
      "_last-serial": 1000000000,
    },
    {
      name: "mdurl",
      "_last-serial": 1000000000,
    },
    {
      name: "meson",
      "_last-serial": 1000000000,
    },
    {
      name: "meson-python",
      "_last-serial": 1000000000,
    },
    {
      name: "milvus-lite",
      "_last-serial": 1000000000,
    },
    {
      name: "mistune",
      "_last-serial": 1000000000,
    },
    {
      name: "mmh3",
      "_last-serial": 1000000000,
    },
    {
      name: "more-itertools",
      "_last-serial": 1000000000,
    },
    {
      name: "mpire",
      "_last-serial": 1000000000,
    },
    {
      name: "mpmath",
      "_last-serial": 1000000000,
    },
    {
      name: "msal",
      "_last-serial": 1000000000,
    },
    {
      name: "msal-extensions",
      "_last-serial": 1000000000,
    },
    {
      name: "multidict",
      "_last-serial": 1000000000,
    },
    {
      name: "multiprocess",
      "_last-serial": 1000000000,
    },
    {
      name: "murmurhash",
      "_last-serial": 1000000000,
    },
    {
      name: "mypy",
      "_last-serial": 1000000000,
    },
    {
      name: "mypy_extensions",
      "_last-serial": 1000000000,
    },
    {
      name: "nbclient",
      "_last-serial": 1000000000,
    },
    {
      name: "nbconvert",
      "_last-serial": 1000000000,
    },
    {
      name: "nbdime",
      "_last-serial": 1000000000,
    },
    {
      name: "nbformat",
      "_last-serial": 1000000000,
    },
    {
      name: "nbgitpuller",
      "_last-serial": 1000000000,
    },
    {
      name: "nest_asyncio",
      "_last-serial": 1000000000,
    },
    {
      name: "networkx",
      "_last-serial": 1000000000,
    },
    {
      name: "nh3",
      "_last-serial": 1000000000,
    },
    {
      name: "ninja",
      "_last-serial": 1000000000,
    },
    {
      name: "nltk",
      "_last-serial": 1000000000,
    },
    {
      name: "notebook_shim",
      "_last-serial": 1000000000,
    },
    {
      name: "numpy",
      "_last-serial": 1000000000,
    },
    {
      name: "oauthlib",
      "_last-serial": 1000000000,
    },
    {
      name: "odh_jupyter_trash_cleanup",
      "_last-serial": 1000000000,
    },
    {
      name: "openai",
      "_last-serial": 1000000000,
    },
    {
      name: "openpyxl",
      "_last-serial": 1000000000,
    },
    {
      name: "opentelemetry-api",
      "_last-serial": 1000000000,
    },
    {
      name: "opentelemetry-exporter-otlp",
      "_last-serial": 1000000000,
    },
    {
      name: "opentelemetry-exporter-otlp-proto-common",
      "_last-serial": 1000000000,
    },
    {
      name: "opentelemetry-exporter-otlp-proto-grpc",
      "_last-serial": 1000000000,
    },
    {
      name: "opentelemetry-exporter-otlp-proto-http",
      "_last-serial": 1000000000,
    },
    {
      name: "opentelemetry-proto",
      "_last-serial": 1000000000,
    },
    {
      name: "opentelemetry-sdk",
      "_last-serial": 1000000000,
    },
    {
      name: "opentelemetry-semantic-conventions",
      "_last-serial": 1000000000,
    },
    {
      name: "orjson",
      "_last-serial": 1000000000,
    },
    {
      name: "packaging",
      "_last-serial": 1000000000,
    },
    {
      name: "pandas",
      "_last-serial": 1000000000,
    },
    {
      name: "pandocfilters",
      "_last-serial": 1000000000,
    },
    {
      name: "parso",
      "_last-serial": 1000000000,
    },
    {
      name: "partd",
      "_last-serial": 1000000000,
    },
    {
      name: "patchelf",
      "_last-serial": 1000000000,
    },
    {
      name: "pathspec",
      "_last-serial": 1000000000,
    },
    {
      name: "pdm-backend",
      "_last-serial": 1000000000,
    },
    {
      name: "pdm-pep517",
      "_last-serial": 1000000000,
    },
    {
      name: "pexpect",
      "_last-serial": 1000000000,
    },
    {
      name: "pillow",
      "_last-serial": 1000000000,
    },
    {
      name: "pip",
      "_last-serial": 1000000000,
    },
    {
      name: "pkgconfig",
      "_last-serial": 1000000000,
    },
    {
      name: "pkginfo",
      "_last-serial": 1000000000,
    },
    {
      name: "platformdirs",
      "_last-serial": 1000000000,
    },
    {
      name: "pluggy",
      "_last-serial": 1000000000,
    },
    {
      name: "ply",
      "_last-serial": 1000000000,
    },
    {
      name: "poetry-core",
      "_last-serial": 1000000000,
    },
    {
      name: "poetry-dynamic-versioning",
      "_last-serial": 1000000000,
    },
    {
      name: "polars",
      "_last-serial": 1000000000,
    },
    {
      name: "polyfactory",
      "_last-serial": 1000000000,
    },
    {
      name: "polyleven",
      "_last-serial": 1000000000,
    },
    {
      name: "preshed",
      "_last-serial": 1000000000,
    },
    {
      name: "prometheus_client",
      "_last-serial": 1000000000,
    },
    {
      name: "prompt_toolkit",
      "_last-serial": 1000000000,
    },
    {
      name: "propcache",
      "_last-serial": 1000000000,
    },
    {
      name: "protobuf",
      "_last-serial": 1000000000,
    },
    {
      name: "proto-plus",
      "_last-serial": 1000000000,
    },
    {
      name: "psutil",
      "_last-serial": 1000000000,
    },
    {
      name: "psycopg2-binary",
      "_last-serial": 1000000000,
    },
    {
      name: "ptyprocess",
      "_last-serial": 1000000000,
    },
    {
      name: "pure_eval",
      "_last-serial": 1000000000,
    },
    {
      name: "pyaml",
      "_last-serial": 1000000000,
    },
    {
      name: "pyarrow",
      "_last-serial": 1000000000,
    },
    {
      name: "pyasn1",
      "_last-serial": 1000000000,
    },
    {
      name: "pyasn1_modules",
      "_last-serial": 1000000000,
    },
    {
      name: "pybind11",
      "_last-serial": 1000000000,
    },
    {
      name: "PyBindGen",
      "_last-serial": 1000000000,
    },
    {
      name: "pycparser",
      "_last-serial": 1000000000,
    },
    {
      name: "pydantic",
      "_last-serial": 1000000000,
    },
    {
      name: "pydantic_core",
      "_last-serial": 1000000000,
    },
    {
      name: "pydantic-settings",
      "_last-serial": 1000000000,
    },
    {
      name: "pyelftools",
      "_last-serial": 1000000000,
    },
    {
      name: "Pygments",
      "_last-serial": 1000000000,
    },
    {
      name: "PyJWT",
      "_last-serial": 1000000000,
    },
    {
      name: "pylatexenc",
      "_last-serial": 1000000000,
    },
    {
      name: "pymilvus",
      "_last-serial": 1000000000,
    },
    {
      name: "pymongo",
      "_last-serial": 1000000000,
    },
    {
      name: "PyNaCl",
      "_last-serial": 1000000000,
    },
    {
      name: "pyparsing",
      "_last-serial": 1000000000,
    },
    {
      name: "pypdf",
      "_last-serial": 1000000000,
    },
    {
      name: "pypdfium2",
      "_last-serial": 1000000000,
    },
    {
      name: "pyproject_hooks",
      "_last-serial": 1000000000,
    },
    {
      name: "pyproject-metadata",
      "_last-serial": 1000000000,
    },
    {
      name: "pytest-runner",
      "_last-serial": 1000000000,
    },
    {
      name: "python-dateutil",
      "_last-serial": 1000000000,
    },
    {
      name: "python-docx",
      "_last-serial": 1000000000,
    },
    {
      name: "python-dotenv",
      "_last-serial": 1000000000,
    },
    {
      name: "python-json-logger",
      "_last-serial": 1000000000,
    },
    {
      name: "python-multipart",
      "_last-serial": 1000000000,
    },
    {
      name: "python-pptx",
      "_last-serial": 1000000000,
    },
    {
      name: "pythran",
      "_last-serial": 1000000000,
    },
    {
      name: "pytz",
      "_last-serial": 1000000000,
    },
    {
      name: "PyYAML",
      "_last-serial": 1000000000,
    },
    {
      name: "pyzmq",
      "_last-serial": 1000000000,
    },
    {
      name: "ragas",
      "_last-serial": 1000000000,
    },
    {
      name: "readme_renderer",
      "_last-serial": 1000000000,
    },
    {
      name: "redis",
      "_last-serial": 1000000000,
    },
    {
      name: "referencing",
      "_last-serial": 1000000000,
    },
    {
      name: "regex",
      "_last-serial": 1000000000,
    },
    {
      name: "requests",
      "_last-serial": 1000000000,
    },
    {
      name: "requests-oauthlib",
      "_last-serial": 1000000000,
    },
    {
      name: "requests-toolbelt",
      "_last-serial": 1000000000,
    },
    {
      name: "reward_hub",
      "_last-serial": 1000000000,
    },
    {
      name: "rfc3339_validator",
      "_last-serial": 1000000000,
    },
    {
      name: "rfc3986",
      "_last-serial": 1000000000,
    },
    {
      name: "rfc3986_validator",
      "_last-serial": 1000000000,
    },
    {
      name: "rfc3987-syntax",
      "_last-serial": 1000000000,
    },
    {
      name: "rich",
      "_last-serial": 1000000000,
    },
    {
      name: "roman-numerals-py",
      "_last-serial": 1000000000,
    },
    {
      name: "rpds-py",
      "_last-serial": 1000000000,
    },
    {
      name: "rq",
      "_last-serial": 1000000000,
    },
    {
      name: "rsa",
      "_last-serial": 1000000000,
    },
    {
      name: "rtree",
      "_last-serial": 1000000000,
    },
    {
      name: "s3fs",
      "_last-serial": 1000000000,
    },
    {
      name: "s3transfer",
      "_last-serial": 1000000000,
    },
    {
      name: "safetensors",
      "_last-serial": 1000000000,
    },
    {
      name: "scikit-build",
      "_last-serial": 1000000000,
    },
    {
      name: "scikit_build_core",
      "_last-serial": 1000000000,
    },
    {
      name: "scikit-learn",
      "_last-serial": 1000000000,
    },
    {
      name: "scipy",
      "_last-serial": 1000000000,
    },
    {
      name: "sdg_hub",
      "_last-serial": 1000000000,
    },
    {
      name: "SecretStorage",
      "_last-serial": 1000000000,
    },
    {
      name: "semantic_version",
      "_last-serial": 1000000000,
    },
    {
      name: "semchunk",
      "_last-serial": 1000000000,
    },
    {
      name: "Send2Trash",
      "_last-serial": 1000000000,
    },
    {
      name: "sentencepiece",
      "_last-serial": 1000000000,
    },
    {
      name: "sentence-transformers",
      "_last-serial": 1000000000,
    },
    {
      name: "setuptools",
      "_last-serial": 1000000000,
    },
    {
      name: "setuptools-git-versioning",
      "_last-serial": 1000000000,
    },
    {
      name: "setuptools-rust",
      "_last-serial": 1000000000,
    },
    {
      name: "setuptools-scm",
      "_last-serial": 1000000000,
    },
    {
      name: "shapely",
      "_last-serial": 1000000000,
    },
    {
      name: "shellingham",
      "_last-serial": 1000000000,
    },
    {
      name: "simpervisor",
      "_last-serial": 1000000000,
    },
    {
      name: "six",
      "_last-serial": 1000000000,
    },
    {
      name: "smart_open",
      "_last-serial": 1000000000,
    },
    {
      name: "smmap",
      "_last-serial": 1000000000,
    },
    {
      name: "sniffio",
      "_last-serial": 1000000000,
    },
    {
      name: "snowballstemmer",
      "_last-serial": 1000000000,
    },
    {
      name: "soupsieve",
      "_last-serial": 1000000000,
    },
    {
      name: "spacy",
      "_last-serial": 1000000000,
    },
    {
      name: "spacy-legacy",
      "_last-serial": 1000000000,
    },
    {
      name: "spacy-loggers",
      "_last-serial": 1000000000,
    },
    {
      name: "Sphinx",
      "_last-serial": 1000000000,
    },
    {
      name: "sphinxcontrib-applehelp",
      "_last-serial": 1000000000,
    },
    {
      name: "sphinxcontrib-devhelp",
      "_last-serial": 1000000000,
    },
    {
      name: "sphinxcontrib-htmlhelp",
      "_last-serial": 1000000000,
    },
    {
      name: "sphinxcontrib-jsmath",
      "_last-serial": 1000000000,
    },
    {
      name: "sphinxcontrib-qthelp",
      "_last-serial": 1000000000,
    },
    {
      name: "sphinxcontrib-serializinghtml",
      "_last-serial": 1000000000,
    },
    {
      name: "SQLAlchemy",
      "_last-serial": 1000000000,
    },
    {
      name: "srsly",
      "_last-serial": 1000000000,
    },
    {
      name: "sse-starlette",
      "_last-serial": 1000000000,
    },
    {
      name: "stack_data",
      "_last-serial": 1000000000,
    },
    {
      name: "starlette",
      "_last-serial": 1000000000,
    },
    {
      name: "sympy",
      "_last-serial": 1000000000,
    },
    {
      name: "tabulate",
      "_last-serial": 1000000000,
    },
    {
      name: "tenacity",
      "_last-serial": 1000000000,
    },
    {
      name: "termcolor",
      "_last-serial": 1000000000,
    },
    {
      name: "terminado",
      "_last-serial": 1000000000,
    },
    {
      name: "thinc",
      "_last-serial": 1000000000,
    },
    {
      name: "threadpoolctl",
      "_last-serial": 1000000000,
    },
    {
      name: "tiktoken",
      "_last-serial": 1000000000,
    },
    {
      name: "tinycss2",
      "_last-serial": 1000000000,
    },
    {
      name: "tokenizers",
      "_last-serial": 1000000000,
    },
    {
      name: "toml",
      "_last-serial": 1000000000,
    },
    {
      name: "tomlkit",
      "_last-serial": 1000000000,
    },
    {
      name: "toolz",
      "_last-serial": 1000000000,
    },
    {
      name: "torch",
      "_last-serial": 1000000000,
    },
    {
      name: "torchao",
      "_last-serial": 1000000000,
    },
    {
      name: "torchvision",
      "_last-serial": 1000000000,
    },
    {
      name: "tornado",
      "_last-serial": 1000000000,
    },
    {
      name: "tqdm",
      "_last-serial": 1000000000,
    },
    {
      name: "traitlets",
      "_last-serial": 1000000000,
    },
    {
      name: "transformers",
      "_last-serial": 1000000000,
    },
    {
      name: "triton",
      "_last-serial": 1000000000,
    },
    {
      name: "trove-classifiers",
      "_last-serial": 1000000000,
    },
    {
      name: "twine",
      "_last-serial": 1000000000,
    },
    {
      name: "typeguard",
      "_last-serial": 1000000000,
    },
    {
      name: "typer",
      "_last-serial": 1000000000,
    },
    {
      name: "types-psutil",
      "_last-serial": 1000000000,
    },
    {
      name: "types-python-dateutil",
      "_last-serial": 1000000000,
    },
    {
      name: "types-setuptools",
      "_last-serial": 1000000000,
    },
    {
      name: "typing_extensions",
      "_last-serial": 1000000000,
    },
    {
      name: "typing_inspect",
      "_last-serial": 1000000000,
    },
    {
      name: "typing-inspection",
      "_last-serial": 1000000000,
    },
    {
      name: "tzdata",
      "_last-serial": 1000000000,
    },
    {
      name: "tzlocal",
      "_last-serial": 1000000000,
    },
    {
      name: "ujson",
      "_last-serial": 1000000000,
    },
    {
      name: "uri-template",
      "_last-serial": 1000000000,
    },
    {
      name: "urllib3",
      "_last-serial": 1000000000,
    },
    {
      name: "uv",
      "_last-serial": 1000000000,
    },
    {
      name: "uv-build",
      "_last-serial": 1000000000,
    },
    {
      name: "uv-dynamic-versioning",
      "_last-serial": 1000000000,
    },
    {
      name: "uvicorn",
      "_last-serial": 1000000000,
    },
    {
      name: "uvicorn-worker",
      "_last-serial": 1000000000,
    },
    {
      name: "uvloop",
      "_last-serial": 1000000000,
    },
    {
      name: "versioneer",
      "_last-serial": 1000000000,
    },
    {
      name: "wasabi",
      "_last-serial": 1000000000,
    },
    {
      name: "watchfiles",
      "_last-serial": 1000000000,
    },
    {
      name: "wcwidth",
      "_last-serial": 1000000000,
    },
    {
      name: "weasel",
      "_last-serial": 1000000000,
    },
    {
      name: "webcolors",
      "_last-serial": 1000000000,
    },
    {
      name: "webencodings",
      "_last-serial": 1000000000,
    },
    {
      name: "websocket-client",
      "_last-serial": 1000000000,
    },
    {
      name: "websockets",
      "_last-serial": 1000000000,
    },
    {
      name: "wheel",
      "_last-serial": 1000000000,
    },
    {
      name: "wrapt",
      "_last-serial": 1000000000,
    },
    {
      name: "xlsxwriter",
      "_last-serial": 1000000000,
    },
    {
      name: "xxhash",
      "_last-serial": 1000000000,
    },
    {
      name: "yarl",
      "_last-serial": 1000000000,
    },
    {
      name: "zipp",
      "_last-serial": 1000000000,
    },
    {
      name: "zstandard",
      "_last-serial": 1000000000,
    },
  ],
};

export const uniquePackageMock: UniquePackageMetadataResponse = {
  last_serial: 0,
  info: {
    name: "tenacity",
    version: "9.1.2",
    summary: "Retry code until it succeeds",
    keywords: "",
    description:
      "Tenacity is a general-purpose retrying library to simplify the task of adding retry behavior to just about anything.\n",
    description_content_type: "",
    bugtrack_url: undefined,
    docs_url: undefined,
    downloads: {
      last_day: -1,
      last_month: -1,
      last_week: -1,
    },
    download_url: "",
    home_page: "https://github.com/jd/tenacity",
    author: "Julien Danjou",
    author_email: "julien@danjou.info",
    maintainer: "",
    maintainer_email: "",
    license: "Apache 2.0",
    requires_python: ">=3.9",
    package_url: "",
    project_url: "",
    release_url: "",
    project_urls: undefined,
    platform: "",
    requires_dist: [
      'reno; extra == "doc"',
      'sphinx; extra == "doc"',
      'pytest; extra == "test"',
      'tornado>=4.5; extra == "test"',
      'typeguard; extra == "test"',
    ],
    classifiers: [
      "Intended Audience :: Developers",
      "License :: OSI Approved :: Apache Software License",
      "Programming Language :: Python",
      "Programming Language :: Python :: 3",
      "Programming Language :: Python :: 3 :: Only",
      "Programming Language :: Python :: 3.9",
      "Programming Language :: Python :: 3.10",
      "Programming Language :: Python :: 3.11",
      "Programming Language :: Python :: 3.12",
      "Programming Language :: Python :: 3.13",
      "Topic :: Utilities",
    ],
    yanked: false,
    yanked_reason: undefined,
    provides_extras: ["doc", "test"],
    dynamic: ["license-file"],
    license_expression: "",
    license_file: ["LICENSE"],
  },
  releases: {
    "8.5.0": [
      {
        comment_text: "",
        digests: {
          md5: "",
          sha256:
            "b2d0e41673fa197dc692a9fbe5943db0207724fd2e87b1055266c34c598d431f",
        },
        downloads: -1,
        filename: "tenacity-8.5.0-2-py3-none-any.whl",
        has_sig: false,
        md5_digest: "",
        packagetype: "bdist_wheel",
        python_version: "py3",
        requires_python: ">=3.8",
        size: 29241,
        upload_time: "2026-02-05 17:53:41.981882+00:00",
        upload_time_iso_8601: "2026-02-05T17:53:41.981882+00:00",
        url: "https://packages.redhat.com/api/pulp-content/calunga-ui-dev/rhoai/3.0/cpu-ubi9-test/tenacity-8.5.0-2-py3-none-any.whl",
        yanked: false,
        yanked_reason: undefined,
      },
    ],
    "9.1.2": [
      {
        comment_text: "",
        digests: {
          md5: "",
          sha256:
            "1e89d34bd119805da0be9056afed75a1d30fbc5b2b5e124ab1aafc9d06d3f20b",
        },
        downloads: -1,
        filename: "tenacity-9.1.2-2-py3-none-any.whl",
        has_sig: false,
        md5_digest: "",
        packagetype: "bdist_wheel",
        python_version: "py3",
        requires_python: ">=3.9",
        size: 29285,
        upload_time: "2026-02-05 17:55:36.055940+00:00",
        upload_time_iso_8601: "2026-02-05T17:55:36.055940+00:00",
        url: "https://packages.redhat.com/api/pulp-content/calunga-ui-dev/rhoai/3.0/cpu-ubi9-test/tenacity-9.1.2-2-py3-none-any.whl",
        yanked: false,
        yanked_reason: undefined,
      },
    ],
  },
  urls: [
    {
      comment_text: "",
      digests: {
        md5: "",
        sha256:
          "1e89d34bd119805da0be9056afed75a1d30fbc5b2b5e124ab1aafc9d06d3f20b",
      },
      downloads: -1,
      filename: "tenacity-9.1.2-2-py3-none-any.whl",
      has_sig: false,
      md5_digest: "",
      packagetype: "bdist_wheel",
      python_version: "py3",
      requires_python: ">=3.9",
      size: 29285,
      upload_time: "2026-02-05 17:55:36.055940+00:00",
      upload_time_iso_8601: "2026-02-05T17:55:36.055940+00:00",
      url: "https://packages.redhat.com/api/pulp-content/calunga-ui-dev/rhoai/3.0/cpu-ubi9-test/tenacity-9.1.2-2-py3-none-any.whl",
      yanked: false,
      yanked_reason: undefined,
    },
  ],
};
