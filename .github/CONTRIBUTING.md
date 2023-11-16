# Contributing to Shuffle

First off, thank you for contributing to [Shuffle](https://shuffler.io/)! Your talents and your contributions are greatly appreciated. With Shuffle, we aim to make cybersecurity more accessible, and keep that in mind with everything we make. 

## Opening a new issue

If you find a bug or think of an improvement or fix, please open a [new issue](https://github.com/frikky/Shuffle/issues/new). Outline every step necessary to reproduce the bug. Include screenshots, logs and/or code examples where applicable. The more thorough you are, the better.

## What you can work on
There are a lot of things to work on in our complex ecosystem. The most pressing issues are documentation, use-cases and content-creation, but any help is appreciated. We'll make sure you get the help you need to get started. Below is an incomplete list of items. If you see an issue, tell us or fix it! :)

#### App Creation (Python & GUI w/OpenAPI)
As with everything else, app creation for Shuffle is made as accessibl as possible with the app editor. However, there are some instances where it can't do the job, and you'll have to write Python code. The App Editor generates OpenAPI specifications and can be widely shared, while Python apps only work for Shuffle and NSA's WALKOFF (which Shuffle is based on). You can find our [OpenAPI apps here](https://github.com/frikky/security-openapis) and our [Python apps here](https://github.com/frikky/shuffle-apps). Apps in these repositories are automatically available after installation. Shuffle apps are searchable on [https://shuffler.io](https://shuffler.io/search).

#### Workflow creation (GUI & Conceptualizing) 
Workflows are where the magic of Shuffle automation happens. Our current ones [are outlined here](https://github.com/frikky/security-openapis), and will be automatically imported into Shuffle instances in the future. They are split into Prepare and Response, but don't necessarily have to be. If you'd like to talk about workflow creation or use-cases in general, either Open a [new issue](https://github.com/frikky/shuffle-workflows/issues/new) or send us an email at [frikky@shuffler.io](mailto:frikky@shuffler.io) 

#### Documentation (Markdown)
Documentation is essential to any product, and Shuffle is no exception. Documentation in Shuffle uses markdown and is located in the [shuffle-docs](https://github.com/frikky/shuffle-docs/tree/master/docs) repository. These are then loaded into Shuffle when someone visits [https://shuffler/docs/about](https://shuffler/docs/about), then cached for later use. If you make an edit, expect it on our website in about an hour. 

#### Frontend (ReactJS)
The frontend of Shuffle is what everyone sees when they log in. Our goal here is to make it easy to get started and keep going with Shuffle - removing any blockers from the point of accessibility. If you'd like to get started, find [an issue](https://github.com/frikky/Shuffle/issues) and check the [installation guide](https://github.com/Shuffle/Shuffle/blob/main/.github/install-guide.md) for setting it up locally without Docker. 

#### Backend (Golang)
The backend of Shuffle is our REST API Server that runs in the background, handling all the API-calls in general, whether from users or apps. If you'd like to get started, find [an issue](https://github.com/frikky/Shuffle/issues) and check the [installation guide](https://github.com/Shuffle/Shuffle/blob/main/.github/install-guide.md) for setting it up locally without Docker. 

#### Scaling (Golang & Python)
Shuffle runs using Docker, and is built to scale. There are many areas that may revolve around scaling, but the main issues come down to how we use Docker in our [architecture](https://shuffler.io/docs/architecture). If you want to help by submitting Helm charts (K8s), Docker swarm configurations, blogposts, or talk about code changes that would help scaling - please reach out (or just start building!), and we can discuss the possibilities. Make sure to read about the architecture first :)

#### Testing 
Whether it's security testing, code testing or CI/CD, we could always need another hand. E.g. an example of CI/CD used for apps can be found [here](https://github.com/Shuffle/Shuffle-apps/blob/master/.github/workflows/ci.yaml), but we don't at all limit the scope to Github actions. If you find a security issue, whether open source or not, please contact [security@shuffler.io](mailto:security@shuffler.io) or [contact us on our website](https://shuffler.io/contact).

#### Community 
What is a product without a community? Want to help out? Whether it be through blogposts, videos or community management, don't hesitate to [reach out](https://shuffler.io/contact) if you would like to help, and get a more keen understanding of how we work. (PS: We're hiring)

## Working on an issue

**Shuffle** uses the [GitHub flow](https://guides.github.com/introduction/flow/index.html). All project changes are made through pull requests.
If you see an issue that you would like to work on, leave a quick comment or just get cracking. 

### License

All contributions are made under either the **GNU Affero General Public License v3.0** or **MIT** license. See below for further details.

* [Main project license - AGPLv3](https://github.com/frikky/Shuffle/blob/master/LICENSE)
* [Apps - MIT](https://github.com/frikky/Shuffle-apps/blob/master/LICENSE)
* [Workflows - MIT](https://github.com/frikky/Shuffle-workflows/blob/master/LICENSE)
* [Documentation - MIT](https://github.com/frikky/Shuffle-docs/blob/master/LICENSE)
