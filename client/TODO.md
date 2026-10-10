- Why do we have EntityDetail.tsx EntityModal.tsx EntityWizardBody.tsx, the modal and form should be per entity, do not over generalize
- use /home/cferiavi/git/github/konveyor/tackle2-ui as an example for the wizard

- the Forms should render the errors inside the form itself with an error at the top of the form
- Create publication form is either asyn or it does not work

- use null instead of undefined
- move descriptors to components or hooks or somewhere
- families.ts contains forms info, wrong, should be split

- verify href are never used in the queries and we always create the axios path on the client side
- reevaluate getEntityPlugin and the fact that it requires 2 params

- useEntityDelete should be replaced for a normal Mutation (evaluate it at least)

- ise href in rest paths in axios because it will simplify a lot of logic, just make sure there are comments with examples of the paths
