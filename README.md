## CAVLIN Network Web App

This is the home of the source code for the [CALVIN network app](cwn-regions.casil.ucdavis.edu).

#### Data Repository

The data repo can be found [here](https://github.com/ucd-cws/calvin-network-data)

#### Import data

First make sure you have [MongoDB](https://www.mongodb.com/) installed and running
on the default port.  Then run:

 ```
git clone https://github.com/ucd-cws/calvin-network-data.git
cd [/path/to/ca-network-app/root/dir]
npm install
cd import
node regions [/path/to/calvin-network-data/data] [branch name]
```
Make sure you supply the correct branch name, this will be used to fill in the
github links as well as repo information.

#### Run Application Locally

To run the application locally, first import the data repo (see above).  Then
copy the mqeConfig.js file to a separate dir.  Edit the 'root' variable to point
at your ca-water-network repo install directory.  Then run

```
cd [/path/to/ca-network-app/root/dir]
npm install
node node_modules/MongoQueryEngine/server.js [/path/to/custom/mqeConfig.js]
```

#### Supply Edits to Network Data

If you wish to make changes to the network application data, first fork to calvin-network-data
repo.  To do this go [here](https://github.com/ucd-cws/calvin-network-data) and click 'fork' in the upper right hand corner
(GitHub account required).  Then pull your newly forked repo to your local machine
and import the data using the import steps above.  Make sure you point at your forked repo!
You can then launch and test changes to the data by running the import script whenever
you make a change.  Then use the local application instance to test.  Finally if
you wish to submit changes, push your changes back to github then make a pull request
back to our data repo.