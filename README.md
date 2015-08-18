#Neighborhood Explorer App
##What is it
**Neighborhood Explorer** is a single page web application that uses the Google Maps and FourSquare API to show users interesting places around the location they just queried.

##How to set up
First and foremost you will need to install the dependencies required by this app, you can do so by going to this folder inside terminal and then type: `npm install`.

Once the dependencies `knockout.js` and `semantic ui` are installed, you can set up a simple server and run our app by following the steps below:
* Run a simple python http server on port 5001 like so `python -m SimpleHTTPServer 5001`
* Open up a browser window and go to localhost:5001[localhost:5001] and you should be able to see this app running.

##How to use
Using **Neighborhood Explorer** is simple, search a location in the search bar, it can be a detailed address or the name of a city, then press "enter" key. Then you should see ten fun places recommended by FourSquare and their respective location marked on the map. If you want to learn more about them, you can click the **show fun places** button on bottom right.

If you want to filter the results, feel free to type the keyword directly in the search bar, the results will change as you type. And if you want to do a new search with what you just typed, just hit the "enter" key.

Also please note that if you are on a smaller screen, the results may not be shown in full, but you can scroll down the list to view the rest of them.

If you want to learn more about each location, you can either click on the marker, or the corresponding list item.
