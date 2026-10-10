- make sure the context pulp domain selector saves the domain in the url and not in storage

- going to the details page route is overcomplicated. in code.
  - also the url uses query parameters which is not needed. e.g. http://localhost:3000/content-management/distributions/01a0cfe0-7b37-7e85-a5a6-d3d89685e330?type=python.pypi
- Why do we have EntityDetail.tsx EntityModal.tsx EntityWizardBody.tsx, the modal and form should be per entity, do not over generalize
- use /home/cferiavi/git/github/konveyor/tackle2-ui as an example for the wizard

- the Forms should render the errors inside the form itself with an error at the top of the form
- Create publication form is either asyn or it does not work

- use null instead of undefined
- move descriptors to components or hooks or somewhere
- families.ts contains forms info, wrong, should be split
