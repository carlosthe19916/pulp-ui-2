---
name: ai-assistant
description: The AI assistant (2.x) exists only when the operator has configured an LLM provider, any provider; it answers with the UI's own components, reads Pulp as the signed-in user, only reads, and never handles an LLM key in the browser.
status: Accepted
---

# 0019. The AI assistant: operator-enabled, any provider, the UI's own components

Applies from 2.0.

## Context

Version 2.x adds AI features ([VERSIONING.md](../../VERSIONING.md)). The first is an assistant:
the user asks about what Pulp holds ("show me repository `foo`") and gets the answer in a chat
panel next to the page.

An assistant that draws its answers can do so at three levels of freedom:

- **Controlled:** the model picks one of the screens or components the UI already has and fills
  in its data.
- **Declarative:** the model assembles a layout from a fixed set of building blocks.
- **Open:** the model writes the markup itself.

The more freedom, the less the answers look and behave like the rest of the UI, and the harder
they are to test, to keep accessible and to secure.

Deployments differ in what they can use. Some may send data to a hosted model vendor, others
must keep it on their own network with a self-hosted model, and many have no model at all. A
provider key is a secret, and it costs money with every request.

Pulp decides what each user may see ([0008](0008-permission-aware-actions.md)), whether they
signed in with a password, a token or single sign-on.

## Rules

- [ ] The AI features exist only when the operator has configured an LLM provider for the
      deployment. Without one, the UI shows no assistant, no AI wording, no AI settings and no
      disabled AI controls: it looks and works exactly as a UI without AI. (Unlike an action the
      user may not run, [0008](0008-permission-aware-actions.md), a missing provider is a
      property of the deployment, not of the user, so it is hidden rather than disabled.)
- [ ] The operator chooses the provider and the model. Any provider works: a hosted vendor, or
      a self-hosted model behind an OpenAI-compatible endpoint. Changing provider or model needs
      configuration only, never a new UI release.
- [ ] Users never enter, see or store an LLM key, and the key never reaches the browser.
- [ ] The assistant answers in its chat panel, and shows results with the UI's own components
      (cards, lists, labels, links to the existing pages). It never shows markup or components
      the model wrote.
- [ ] The assistant reads Pulp as the signed-in user, with that user's permissions. It never
      shows what the user couldn't open in the UI, and says so when a read is refused.
- [ ] The assistant only reads. It never creates, changes or deletes anything in Pulp, and never
      starts a task.
- [ ] The chat panel says that its answers are AI-generated and can be wrong.
- [ ] A conversation lasts until the page is reloaded or the user signs out. Nothing is saved.

## Consequences

- No vendor lock-in. Operators who can't send data out can run a model on their own network.
- No secret is ever in a browser. The provider key stays with the operator, who also controls
  the cost.
- A deployment without a provider is unaffected: nothing about the assistant is shown or
  loaded.
- Permissions work as everywhere else, because the assistant reads through the user's own
  access. It can't become a way around them.
- What the assistant reads to answer a question is sent to the operator's provider. Operators
  who don't want that choose a self-hosted model.
- Each new thing the assistant can show is a component the UI team builds. New abilities come
  slower than with model-written screens, but every answer looks, behaves and is tested like the
  rest of the UI.
- Users can't bring their own key, and cost can't be traced to a user. Letting the assistant
  change things, users bringing their own keys, and saved conversations each need a new record.
