# Shuffle 
[Shuffle](https://shuffler.io) is the platform for automation needs (SOAR). It has thousands of premade integrations and uses open frameworks like OpenAPI to ease migration. The workflow editor is based on a no-code thought process to empower non-developer, and the app creator makes you able to inegrate any platform in minutes.

**It's in BETA** - [Get in touch](https://shuffler.io/contact), send a mail to [frikky@shuffler.io](mailto:frikky@shuffler.io) or poke me on twitter [@frikkylikeme](https://twitter.com/frikkylikeme)

![Example Shuffle webhook integration](https://github.com/frikky/Shuffle/blob/master/frontend/src/assets/img/shuffle_webhook.png)

## Getting started 
* Self-hosted: Check out the [installation guide](https://github.com/frikky/shuffle/blob/master/install-guide.md) and [getting started](https://shuffler.io/docs/getting_started)
* Cloud: Register at https://shuffler.io/register and get cooking (there are some differences!)

## Blogposts
[1. Introducing Shuffle](https://medium.com/security-operation-capybara/introducing-shuffle-an-open-source-soar-platform-part-1-58a529de7d12)
[2. Getting started with Shuffle](https://medium.com/security-operation-capybara/getting-started-with-shuffle-an-open-source-soar-platform-part-2-1d7c67a64244)

## Related repositories
* Apps: https://github.com/frikky/shuffle-apps
* Workflows: https://github.com/frikky/shuffle-workflows (empty)
* Security OpenAPI apps: https://github.com/frikky/OpenAPI-security-definitions
* Documentation: https://github.com/frikky/shuffle-docs

## Documentation
Documentation can be found on https://shuffler.io/docs/about or in your own instance. Currently lacking: 
* API documentation 
* Updates after migrating from SaaS to open source

## Features
* Simple workflow automation editor 
* Premade apps for a number of security tools
* App creator for [OpenAPI](https://github.com/frikky/OpenAPI-security-definitions)
* Easy to learn Python library for custom apps

## In the works
* Premade workflows for security professionals
* Dashboard - Statistics are implemented
* App versioning

## Support
Open an issue on Github, or [join the gitter chat](https://gitter.im/Shuffle-SOAR/community). For other / private requests: [frikky@shuffler.io](mailto:frikky@shuffler.io)

## Website
https://shuffler.io

## License
All modular information related to Shuffle will be under MIT (anyone can use it for whatever purpose), with Shuffle itself using AGPLv3. 

Apps & App SDK: MIT
Shuffle backend: AGPLv3 

### Project overview 
Below is the folder structure with a short explanation
```bash
├── README.md				# What you're reading right now
├── backend					# Contains backend related code.
│   ├── go-app 			# The backend golang webserver
│   ├── app_gen 		# Code for app generation outside the Shuffle platform
│   └── app_sdk			# The SDK used for apps
├── frontend				# Contains frontend code. ReactJS and cytoscape. Horrible code :)
├── functions				# Contains google cloud function code mainly.
│   ├── static_baseline.py	# Static code used by stitcher.go to generate code
│   ├── stitcher.go		# Attempts to stitch together an app - part of backend now
│   ├── onprem				# Code for onprem solutions
│   │   ├── Orborus 	# Distributes execution locations
│   │   ├── Worker		# Runs a workflow
└ docker-compose.yml 	# Used for deployments
```
