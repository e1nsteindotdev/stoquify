# PRODUCTS PAGE


### ANALYTICS PAGE
    [ ]  - the y axis labels on the revenue over time chart have too many decimals that it gets outside the box
      the background bg on the bars on the "Couverture de Stock (Jours)" doesn't appear good enough
    [ ] - change the seed enough well enough that you the heat map is looks more logical right now, in weekdays almost all the squares have the same color (maybe because of no sales, or because of sales with the same amount)
    [ ] - the stock Dormant chart, simplify to be like this: it would a have 3 cards one for +30, one for +60 and one for +60, in each cards, you would have the skus written, with how many are in the dead stock (quantity) of that sku with their whole value, and anoter number if the store profitted yet from teh whole product, we calculate it by simply counting how many products existed at first, by searching for sales/orders that have the productId we accumalte their quantities, and then we add up the qunatities of the skus of that product, then we multiply this number by the cost of each product, and then we go back to the sales/orders with that product, we calculate how much money we made from that product and we subtract from the cost of the whole initial inventory, like this we can know how profitable we are on the product it should a + or - number with either green or red. and we do that for all the skus on the 3 cards.
    [ ] - in top 10 products there is 4 "Produit inconnue", investigate where the problem is, it could be in the analyitcs ui logics and that would be very bad, or it could from the wrong seed data

### PRODUCTS TABLE
    [ ]-  products table shows no sales/orders even tho I have confirmed that there exists sales/orders attached to the products, but found only few in the salesPerProduct function in convex products file, like there is only 4 products that have sales, and it shows only few sales while there are thousands of sales/orders. so the problem is not in the table or in the ui, but I think in the seed file that injects thousands of orders and sales but not into the right product ids, even tho I checked the code file for the seed logic and it seems fine.
    [ ] - change the ui shown in the collapsable content on the produts table, first thing make the skus list not rounded make the squares bigger and have no bg color. and also add all infos about the product in a clean ui way, the product desc, images, skus with quantities, the category for that product, the collection the produt is attached too and the state of the product (active, cache, incomplet) and it also shows statics about the product, shows the important stats and put them there in a clean ui. 

### PRODUCTS FORM
    [ ] -  change the styling of the borders in the images field to be not rounded, bascially, where ever we found that the border is set on a div, we make sure there is no rounding on that div.
    [ ] -  make the save button only disabled after the animation finishes, like afte c'est bon and it switches back to "enregister" then and only then we make it disabled, we need to find a smart way to do this in a clean way.
    [ ] -  the ordring of the images dones't persist, like when you reordre the iamges, and then you save and then you reload the go back to their original order.
    [ ] - add a clean skelton loader when we enter the form page.
    [ ] -  make every box in the variants field that has a border not rounded. even in the create new variant form.
    [ ] -  also the forms loads empty, and then the product data flashes in suddenly, this is bad ux, we should stay at the skelton loader until we make sure if a products exists from the slug or not, if it doens't we just show the create product form. also this should be instant because we do the check from tanstack db collection and we should refetch (retrigger the queryFn of the collection in a clean way) if we don't find the product in the collection just to make sure.
    [ ] - also whenever we do a save, we trigger the queryFn of the products collection again.
    [ ] - the logic that makes the button disabled is flawed, for example if you add a variant, with options and then you save it, the button should turn disabled because there are no changes left but that doesn't happen.

### LES COMMANDES TABLE
    [ ] - The EN MAGASINE | EN LIGNE field shouldn't be in a tag, just make it a black text with no background all uppercase.
    [ ] - the date shows invalid date probably of the type mistmatch, investigate why and fix it
    [ ] - make the green, red and yellow colors have more hue and less saturated to match the serious brand of the sofwtare
    
### CLIENTS TABLE
    [ ] - add a column that shows the last date the client has ordered in, and two columns one for the revenue and one for the pure profit generated only from this customer
    [ ] - when you click on the "voir" client it shows a const spinner, it should instead show all the informations on that client with the KPIs that where on the table and cards showing all his past orders all in a clean ui.

### EMPLOYEES PAGE
    [ ] - first thing fix the ugly design to be similar to the other parts of the app.
    [ ] - rebrand the founder word into let say "Patron" only in the ui (what the user sees)
    [ ] - the wild card * should reformated to "touts" instead
    [ ] - the founders, staff and admins should be places by column where we would have three columns (for mobile they would represent rows), and each clumn should have it create new employee button, example in the staff column, besides it there is add a new staff member button and so on. when there is no staff for example we show the staff column and we show it empty, aslo we append the pending invitations on the end of the stack on the right column where you can delete or view its qr code.
    [ ] - change the create new employee form to be like this, first remove the optional email field, also remove the role field because it would have been already determined by which button was clicked, and only show a permissions page buildling ui. This ui should be like this, we should a collapsable per store, when you expand a collapsable of that store you get all the ressources stacked in a column and then in the second column you get an options field where you can choose the permissions on that resource, the options would be write, read, none, and the they all default ot none. Make sure everything is rounded in this ui.

### LES FACTURES PAGES
    [ ] - create new tab in the dashboard name "factures", the feature has the purpose only to easily print and document pdfs/imgs same events that happen within the dashboard, so mostly you can create a facture out of  sale, out of a "depense" and so, so do a feature planning for this.

### RAPOPRTS

### AUTH 
    [ ]  - in the account dropmenu in the buttom of the sidebar of the dashboard, we add an option to generate a QR code and the account owner scans it to signin, the generated qr code should have state if it has been used or not, and if it has been used you can't use it again, but there should a be re-generate button to create another magic link and show its qr code 
    [ ] - add granular permissions to show or not show the tabs, like if a user doens't have products permission, he wouldn't be able to see the products tab, if he doesn't write permission, he wouldn't be able to go to the product form page, if he only has write permission, he see the add new product button and thats it, if he doens't have the delete permission he shouldn't see the delete button on the products table actions and so on, like plan a generate logic mapping of permission, and then apply to all the resources, also update the resources list to have to have all the resources hard coded, and for now simply the permissions to only be read write, remove the detailed ones like delete, create and update (they all fall under write)
    [ ] - just like how I used the custom auth function on createProduct convex mutation, do the same for all the other functions, add the resource and the action the convex function does  


### AUTH BUTTON

### GENERALE
    [X] - reduce the letter spacing for all the text in the whole dashboard app, it is a bit too much.
    [X] - the pagination text at the bottom of the table doesn't update when we apply filter, like the number of records in the table reduces when we apply filters in the table, and the text should reflect that, aka, it should tell how many filter items you are seeing per page over how many records are left when we apply the filter 
    [X] - the table column that has a filter option, should not have an order ascending/descending buttons, that should only be for numbers and only where it makes sense, update all the tables to be like this, and the options button should show the filters directly
    [X] - the date controller that is in the main dashboard pages, should be right on top of the table. not in the beginning of the page right besdies the title and it should have some text before it, like for eg "show data only for this :" (and make it french of course)
    [X] - make the new category, new collection buttons, have bordres all around them not only on the top and make the hover change the bg of the hole bordered box.




