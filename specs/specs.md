# Gut

Ein gut git brauch

Make sure you read the section __Getting started__ before the rest so you are aware of how the flow is supposed to work.

* Getting started
  * [Initialization](#initialization)
    * [Configuration file](#configuration-file)
  * [Spirit of the git flow](#spirit-of-the-git-flow)
    * [Organization of your repositories](#organization-of-your-repositories)
    * [Git branching](#git-branching)
      * [Branch naming](#branch-naming)
* Real Git features
  * [Clone](#clone)

## Initialization

### Configuration file

Gut keeps a configuration file in `~/.gut-config.json`. 
This file is automatically bootstrapped to a (currently fixed) value at startup if it is not found.

Contents of the file:

```json
{
  "username": "Your git username",
  "repositoriesPath": "The path to your folder containing git repositories. Yes it's assumed all are in one place!"
}
```

## Spirit of the git flow

### Organization of your repositories

It is assumed you'll keep all your repositories into a single folder, which will be named __forge__ in the rest of 
this document and is structured like the following.

```
forge
├── owner1
│   ├── repo1
│   └── repo2
└── owner2
    ├── repo1
    └── repo2
```

### Git branching

#### Branch naming 

TODO

## Real git features

### Clone

You can clone a repository by calling `gut clone <owner> <repo>`. 
If you omit the owner, the username from your [configuration file](#configuration-file) will be used.

The repository will be cloned in `<forge>/owner/repo`.
