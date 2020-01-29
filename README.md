Catalogic ECX 3.0
Updated on Jun 14, 2017
By Ronald So


- Introduction -

This git repo contains an Angular UI code base that are built with webpack2, Bootstrap and a few other
NPM plugins.

- To run the UI - 

Simply run "npm install", then "npm start".  See package.json for scripts, dependencies, and Node
version details.

- To build the RPM of the UI -

Run build.sh.  It will build the UI with JavaScript minification and uglification process.  It will
also generate a RPM spec file, and ultimately generate a RPM file that Jenkins will put in a specific
staging area.

- To deploy the RPM -

You can either run build.sh and install the RPM locally in your setup; OR, run the main deploy.sh
script that will pull the RPM for the centralized staging area and install in your setup.

- RPM dependency -

The Angular UI relies on two services.  First, the NodeJS service (cdmservice) NPM package.  Second,
the core service NPM package (ecx).


