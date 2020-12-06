# Mirage Manager
The MirageManager system consists of two seperate applications that connect through
gRPC, which enables MirageManager to manage multiple Xen hosts at the same time.
The application server runs as a central hub for all hosts to connect to and the 
user to issue commands. The application must be launched first, before registering 
hosts becomes possible.

## Config
The application server and the host controller each have their individual config
files in the `cfg` folder.
The `cfg/config.yml` folder contains keys and values. Sensitive values should be set 
as an environment variable, which is indicated in the config by the value being of the type
${value}. Environment variables can be set in the OS or by creating the file `cfg/env` and
defining them there. In the file a environment variable can be defined like `name=value`.
The env file is excluded from upload to git.

## SETUP
### Application Server
* Make sure the user has access to the unikernel-repository git. If
it is not public, authentication must be configured to work without user interaction.
* Connect a terminal to the machine thats supposed to run the application server.
* Clone this repo to that machine.
* Run `npm install` in `/helpers`.
* Cd into `/server/src` and run `npm install` here as well.
* Set all environment variables that need to be set, as indictated by ${VAR} in
  the config file in `/server/cfg/config.yml`. For example when a field in the 
  config says ${PORT}, set the environment PORT to the desired value, 
  by executing `export PORT=8080`. Alternatively an env file can be defined, 
  which the application server will read at startup. This file has to be called 'env'
  and is to be stored in `/server/cfg`. Each line of this file can contain one
  variable which should look like this: `PORT=80`
* Make sure MongoDB is running at the location defined in the config file.
* In `/server/src` execute `npm run start`

The server will be running at the location defined in the config and expose an API
as defined in `/postman_mm_api.json`.

### Host controller
* Connect a terminal to the machine thats acting as a Xen host.
* Make sure there is a software bridge setup on the machine called `br0`
* Make sure the root user has access to the unikernels git repositories. If
they are not public, authentication must be configured to work without user interaction.
* Clone this repo to that machine.
* Run `npm install` in `/helpers`.
* Cd into `/host_controller/src` and run `npm install` here as well.
* Definition of environment variables is the same as for the application server.
* Run 
  ```
     node app.js --name <name> --uri <own_uri> --port <grpc_port> 
      --mm_uri <application-server_uri> --user_name <admin_user_name> 
      --password <admin_password>
  ```
  The uri argument must contain only the base uri of the host (or its IP) the 
  application-server_uri should aleraedy include the port (e.g. 192.168.178.1:8080)

The host controller will register itsself through the application servers API
and then setup a gRPC server to receive commands. When the process receives a 
`SIGSTOP` signal it will deregister with the application server.