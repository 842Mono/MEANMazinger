## Simple Messenger For A Small Group ##

## Features ##
 - Simple profile construction (signup)
 - Token-protected authentication (login & session)
 - List all users on the system
 - Private **live** chat
 - Track user status (whether they're online or not)

## How To Run ##
Make sure the environment is correctly setup. Check "Environment Setup" below.

First clone the repo

Then cd into the root folder (MEANMazinger) and run `npm install`

Then cd into `MEANMazinger/staticDir/frontend/` and also run `npm install`, then run `ng build`

Finally go back to the root folder (MEANMazinger) and run `node server.js`

Hopefully the project should be accessible from the link "http://localhost:5001/" :)

## Environment Setup ##
This project assumes an Ubuntu 16.04 system with the MEAN stack environment installed (node.js & npm & mongodb)

before anything just do `sudo apt update && sudo apt upgrade` just in case.

Installing node.js

download script and run `curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash` and wait for it

then in a new terminal install: `nvm install 6.9.5`

and do `nvm alias default 6.9.5`

and finally `nvm use 6.9.5`

also install `sudo apt install build-essential libssl-dev`

...to check do `node --version` and `npm --version`

after that install angular-cli globaly `npm install -g @angular/cli` (we'll need it later)

Installing mongodb

Add their key `sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927`

Add their repo `echo "deb http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list`

update cache `sudo apt update`

and install `sudo apt-get install -y mongodb-org`

then we need to create a service file `sudo nano /etc/systemd/system/mongodb.service`

paste this:

    [Unit]
    Description=High-performance, schema-free document-oriented >database
    After=network.target

    [Service]
    User=mongodb
    ExecStart=/usr/bin/mongod --quiet --config /etc/mongod.conf

    [Install]
    WantedBy=multi-user.target
 
 and save and exit.
 
 Then start the service `sudo systemctl start mongodb`
 
 quick check `sudo systemctl status mongodb`
 
 and if you want to keep it up on startup `sudo systemctl enable mongodb`
