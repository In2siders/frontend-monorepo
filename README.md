# In2siders

---

There is a old version (generated with AI) with more details but I hate it (too much brainrot). [Click here to read README.ai.md](README.ai.md)

---

(( Image ))

---

### Index
- [Introduction](#introduction)
- [Features](#features)
- [Plans](#plans)
- [Guide](#guide)
- [Contribution](#contribution)

### Introduction

In2siders born as a "final" project for what I'm learning. In2siders is a privacy-first chat app for enterprise applications (but ended being a public app)

We run a zero-knowladge infrastructure to minimize leaks on data. Every message is stored PGP encrypted (attachments aren't, be aware.) and we don't require PII to log-in.

Using PGP Keys to provide a new authentication flow, with a one-time challenge that can only be solved with the private key from the user who expedited it.

### Features

- New Authentication: As explained before, using private & public key to create an authentication flow without emails or passwords.
- Encrypted Groups: All groups are encrypted and symetric keys are protected and cannot be viewed that easily (avoiding leaks. But the key is stored encrypted on client-side, so there is a way to obtain it. )
- Attachments: We have attachments built in, so, you can share not only words but images, videos and more (Attachments aren't encrypted at this moment.)

Much more...

You can see the server-side readme with the features [here](https://github.com/In2siders/backend).

### Plans

The team has a few plans for this project.

First of all, there may be a rollback to a few days before presenting to remove all AI Slop generated to be able to make it to the dead line. After that, some of the plans are:

- Encrypt attachments
- Add a guide to know how everything works (Via analytics we detected that a lot of users don't know how the app works.)
- Add settings (for users and for groups)
- Fix group icons (we need to patch for the new S3 system on the backend)
- Mentions with @user (maybe using like discord with @user-id)

And at this moment, there is no more plans that I can think. Team can add more if they have.

### Guide

There is no guide for the moment, working on a simple way to deploy with docker, stay tunned.

### Contribution

There is no contribution guide for the moment, but the project is already presented, so PRs are avalible and issues too.

Keep in mind we are students and we may not be able to reply or watch issues and PR too often, if there is a long wait (1 week or more), tag me on the conversation so I can get a reminder.

Also, there is no a 100% guarantee your PR will be accepted.

PRs with AI Slop may be refused and closed.

Team (@MteooLops, @Gurasic, @IlJoseMii, @ReinadoRojo) will be reviewing the PRs.
