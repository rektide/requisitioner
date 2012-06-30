# requisitioner
node require/commonjs modules 1.0 implementation for the browser

# Getting Started

# Documentation

# Examples

# Internal

## Reqs
Pulls out a dependency graph for an asked for set of modules.

## Tracker
Tracker extends reqs with a real time file system watching layer. Whenever anything in a reqs dependency graph is changed, tracker intelligently emits all graph elements which require updating (change or new elements).

## NP
Connect endpoint that uses tracker to build prepack modules-cum-dependencies, or, for developer purposes, individual modules, fit for use in a minimal CommonJS Transport/C loader (spiritual predecessor to AMD).

# TODO
* Presently dependency tracking is performed by static analysis. Package.json is not used for resolving dependencies. Supplementing the static analysis with dependency tracking could be useful information.
* Monitor entire directories for changes.
* Tracker watch doesn't properly prep for the re-load of a file, creates duplicate data or obsolete data.

# Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style.

# Release History
(in progress)

## License
Copyright (c) 2012 rektide de la faye  
Licensed under the MIT license.
