#!/usr/bin/python
DOCUMENTATION = r"""
module: greet
short_description: Returns a greeting
description: Returns a greeting for O(name).
options:
  name:
    description: Who to greet.
    type: str
    default: world
author: Pulp UI tutorial
"""

RETURN = r"""
message:
  description: The greeting.
  type: str
  returned: always
"""

from ansible.module_utils.basic import AnsibleModule


def main():
    module = AnsibleModule(argument_spec={"name": {"type": "str", "default": "world"}}, supports_check_mode=True)
    module.exit_json(changed=False, message=f"Hello, {module.params['name']}!")


if __name__ == "__main__":
    main()
