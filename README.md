# Fractal

A tool to help you **build**, **document** and **integrate** component/pattern libraries into your web projects.

[![Build Status](https://img.shields.io/travis/frctl/fractal.svg?style=flat)](https://travis-ci.org/frctl/fractal)
[![NPM Version](https://img.shields.io/npm/v/@frctl/fractal.svg?style=flat)](https://www.npmjs.com/package/@frctl/fractal)

## Introduction

Component (or pattern) libraries are a way of designing and building websites in a modular fashion, breaking up the UI into small, reusable chunks that can then later be assembled in a variety of ways to build anything from larger components right up to whole pages.

Fractal helps you **assemble**, **preview** and **document** website component libraries, and then **integrate** them into your web projects and build processes using custom commands and plugins.

You can think of Fractal as a tool that sits halfway between a pattern library UI generator like [Fabricator](https://fbrctr.github.io) or [PatternLab](http://patternlab.io), and a static site build tool like [Metalsmith](http://metalsmith.io) or [Assemble](https://github.com/assemble/assemble/).

> _**Important:** Fractal is currently considered to be in beta. Until it reaches a 1.0 release there may be breaking changes in minor point-releases, as well as out-of date or incorrect documentation. Use at your own risk!_

## Why Fractal?

Existing tools to help you build these component libraries often force you to use a particular template language, a specific build tool or a pre-determined way to organise the individual elements within your library. They generate a web preview to allow you to browse your rendered components, but generally aren't able to help much when it comes to integrating your component library into your build process or live site.

**Fractal is different.** Fractal lets you create a component library without any restriction on which template language to use. You can use whatever build tool you are comfortable with (or none at all!) and it lets you organise your components in whatever way best matches the needs of your project.

It is built using an **extendable, plugin-based architecture**. The core component and documentation parser is available to build upon, helping you to better integrate your component library into your build system and even your production site.

The core web UI plugin provides a **web-based component library browser** UI, either running as a local web server or as a static HTML export. A **powerful theme API** means you can create your own component library 'skins' from scratch or customise the default theme to your liking.

Fractal can be used both as a command line tool and as a NPM module dependency in your projects.

## Documentation

The Fractal documentation is currently a work-in-progress, but should give you enough to get up and running. Feel free to [open an issue](https://github.com/frctl/fractal/issues) if anything that isn't clear!

[**Read the documentation**](/docs/README.md).

## Requirements

Fractal makes use of a number of ES6 features that mean it currently requires [Node.js](https://nodejs.org) v4.0+ to run.

## Testing

Fractal is a project that has recently evolved rapidly and organically from a proof-of-concept prototype into a more stable, mature tool. Because of this it's currently pretty far behind where it should be in terms of test coverage. Any contributions on this front would be most welcome!

Tests can be run using `npm test`.

## Credits

Fractal is developed and maintained by [Mark Perkins](http://github.com/allmarkedup) and the dev team at [Clearleft](http://clearleft.com).
