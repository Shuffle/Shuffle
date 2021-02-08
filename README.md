# Shuffle 
[Shuffle](https://shuffler.io) is an automation platform to unify your security services (SOAR). It has thousands of premade integrations and is based on open frameworks like OpenAPI and Mitre Att&ck. The workflow editor is based on a no-code thought process to empower non-developers, and the app creator makes you able to integrate any platform in minutes.

[![Discord](https://img.shields.io/discord/463752820026376202.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/B2CBzUm)

![Example Shuffle webhook integration](https://github.com/frikky/Shuffle/blob/master/frontend/src/assets/img/shuffle_webhook.png)

## Try it
* Self-hosted: Check out the [installation guide](https://github.com/frikky/shuffle/blob/master/install-guide.md)
* Cloud: Register at https://shuffler.io/register and get cooking (missing a lot of features)

Please consider [sponsoring](https://github.com/sponsors/frikky) the project if you want to see more rapid development.

## Support
* [Discord](https://discord.gg/B2CBzUm)
* [Twitter](https://twitter.com/shuffleio)
* [Email](mailto:frikky@shuffler.io)
* [Open issue](https://github.com/frikky/Shuffle/issues/new)
* [Shuffler.io](https://shuffler.io/contact)

## Blogposts
* [1. Introducing Shuffle](https://medium.com/security-operation-capybara/introducing-shuffle-an-open-source-soar-platform-part-1-58a529de7d12)
* [2. Getting started with Shuffle](https://medium.com/security-operation-capybara/getting-started-with-shuffle-an-open-source-soar-platform-part-2-1d7c67a64244)
* [3. Integrating Shuffle with Virustotal and TheHive](https://medium.com/@Frikkylikeme/integrating-shuffle-with-virustotal-and-thehive-open-source-soar-part-3-8e2e0d3396a9)
* [4. Real-time executions with TheHive, Cortex and MISP](https://medium.com/@Frikkylikeme/indicators-and-webhooks-with-thehive-cortex-and-misp-open-source-soar-part-4-f70cde942e59)

## Documentation
[Documentation](https://shuffler.io/docs) can be found on https://shuffler.io/docs and is written in https://github.com/frikky/shuffle-docs.

## Related repositories
* Apps: https://github.com/frikky/shuffle-apps
* Workflows: https://github.com/frikky/shuffle-workflows
* Security OpenAPI apps: https://github.com/frikky/security-openapis
* Documentation: https://github.com/frikky/shuffle-docs

## Features
* Simple workflow automation editor 
* Premade apps for a number of security tools
* App creator for [OpenAPI](https://github.com/frikky/OpenAPI-security-definitions)
* Easy to learn Python library for custom apps

## Architecture
![Shuffle Architecture](https://github.com/frikky/Shuffle/blob/master/frontend/src/assets/img/shuffle_architecture.png)

## Website
https://shuffler.io

## Contributors 
![ICPL logo](https://github.com/frikky/Shuffle/blob/launch/frontend/src/assets/img/icpl_logo.png)

**Shuffle**
<a href="https://github.com/frikky/shuffle/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=frikky/shuffle" />
</a>

[**App magicians**](https://github.com/frikky/shuffle-apps)
<a href="https://github.com/frikky/shuffle-apps/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=frikky/shuffle-apps" />
</a>

## License
All modular information related to Shuffle will be under MIT (anyone can use it for whatever purpose), with Shuffle itself using AGPLv3. 

Apps & App SDK: MIT
Shuffle backend: AGPLv3 

### Repository overview 
Below is the folder structure with a short explanation
```bash
├── README.md				# What you're reading right now
├── backend					# Contains backend related code.
│   ├── go-app 			# The backend golang webserver
│   └── app_sdk			# The SDK used for apps
├── frontend				# Contains frontend code. ReactJS, Material UI and cytoscape
├── functions				# Has execution and extension resources, such as the Wazuh integration
│   ├── onprem				# Code for onprem solutions
│   │   ├── Orborus 	# Distributes execution locations
│   │   ├── Worker		# Runs a workflow
└ docker-compose.yml 	# Used for deployments
```

**It's in BETA** - [Get in touch](https://shuffler.io/contact), send a mail to [frikky@shuffler.io](mailto:frikky@shuffler.io) or poke me on twitter [@frikkylikeme](https://twitter.com/frikkylikeme)

