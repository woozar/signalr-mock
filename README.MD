# SignalR Mock

If you want to write some tests for your Microsoft Azure Functions project, that are not "just" unit tests and your functions publish events with SignalR, you probably need to mock the SignalR Service, this project, will help mocking the SignalR endpoints for your tests and "record" all messages, so you can make assertions for specific messages to be sent.

# Which access key can be used?

The mock service completely ignores the Access Key and will accept all requests. Depending on the language that is used for the function app, the app itself will check if the connection string is valid, so i am using an old access key from a signalr instance, that was already deleted. If you don't know whoch key to use, you can just use the same key: YFHTsHX5zQUwjlZcU6ED90cbz4De412W6ytr5X0Rhw0=

## Setting it up with docker compose

As the azure functions cli can create a Dockerfile for the function app, it is an obvious choice to run the tests in docker and setting everything up with docker compose.

The docker-compose file for it could look something like this:

    version: '3.7'
    services:
      signalr:
        image: woozar/signalr-mock:latest
        healthcheck:
          test: ['CMD', 'curl', '-f', 'http://localhost']
          interval: 10s
          timeout: 1s
          retry: 5
        ports:
          - '8080:80'
          - '8081:443'
      azure_functions:
        build:
          context: ../my-functions-app
          dockerfile: Dockerfile
        environment:
          - '<insert your required environment settings for the function app>'
          - 'AzureSignalrConnectionString=http://signalr;AccessKey=<some_valid_access_key>;Version:1.0;'

## Trusting the https certificate of the server

If you want to use https, you need to trust the self signed certificate of the mock service. You can download the certificate from the container. If you are on the host system where the docker-compose is running, you can use GET http://localhost/manage-api/cert or inside a container that is running in the docker-compose network, you can use http://signalr/manage-api/cert

The way how to import the certificate is different depending on the container, you are using.
We are using mcr.microsoft.com/azure-functions/node:4.0 and there we can use a sh script:

    #!/usr/bin/env sh

    while [[ "$(curl -s -o /dev/null -w ''%{http_code}'' http://signalr/health)" != "200" ]]; do sleep 5; done
    curl http://signalr/manage-api/cert > /usr/local/share/ca-certificates/signalr.crt
    update-ca-certificates

This scripts waits for the health endpoint of the api to be ready and then downloads the public certificate and adds it to the list of trusted certificates
