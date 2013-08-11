"use strict";
// set up event handlers
var newItemButton = document.getElementById("addNewItem");
newItemButton.addEventListener("click",addNewItem);
var confirmButton = document.getElementById("confirmNewItem");
confirmButton.addEventListener("click", confirmNewItem);
// event handler to load the list when the window opens
window.addEventListener("load", loadItems);

// caching popular static elements
var quickList = document.getElementById("quickList");

// main list to hold the items
var list = [];

// helper functions
function isUndefined(testObject){
  return (typeof(testObject) === "undefined")
}

//todo code
function todoItem(title, description, complete, bookmark){
  // object closure that stores the todo item values
  self = this;
  if(isUndefined(title))
    self.title = "Unknown";
  else
    self.title = title;
  if(isUndefined(description))
    self.descriptionn = "";
  else
    self.description = description;
  if(isUndefined(complete))
    self.complete = false;
  else
    self.complete = complete;
  if(isUndefined(bookmark))
    self.bookmark = "";
  else
    self.priority = bookmark;
}

function addNewItem(){
  // clear the fields
  var itemTitle = document.getElementById("itemTitle");
  itemTitle.value = "";
  var itemDesc = document.getElementById("itemDesc");
  itemDesc.value = "";
  // display the add new item div
  var newItemForm = document.getElementById("newItemForm");
  newItemForm.style.display = "block";
  // set focus on the title box
  var itemTitle = document.getElementById("itemTitle");
  itemTitle.focus();
}

function confirmNewItem(){
  //create the list item
  var itemTitle = document.getElementById("itemTitle").value;
  var itemDesc = document.getElementById("itemDesc").value;
  // create the item before checking for bookmark so we've got something to point to in the closure
  var item = new todoItem(itemTitle, itemDesc,false);
  list.push(item);
  refreshList();
  // and hide the form again
  var newItemForm = document.getElementById("newItemForm");
  newItemForm.style.display = "none";

  //check for bookmark
  var bmcheck  = document.getElementById("checkBookmark").checked;
  if(bmcheck){
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      item.bookmark = (tabs[0].url);
      refreshList();
      storeItems();
    });
  } else {
    // only store the items if we haven't got a bookmark, because the callback will do it if we have
    storeItems();
  }
}

function createItem(item){
  // add a new item to the list

  var todoItem = document.createElement("li");
  todoItem.className="todoItem";
  quickList.appendChild(todoItem);

  // complete button
  var box = document.createElement("img");
  if(!item.complete){
    box.className = "setComplete";
    box.src="./tickbox.svg";
    todoItem.appendChild(box);
    box.addEventListener("click",function(){completeItem(item);});
  } else {
    box.className = "setIncomplete";
    box.src="./tickbox-ticked.svg";
    todoItem.appendChild(box);
    box.addEventListener("click",function(){revertItem(item);});
  }

  // title
  var titleSpan = document.createElement("span");
  titleSpan.className = "itemTitle";
  titleSpan.innerHTML =item.title;
  todoItem.appendChild(titleSpan);
  // bookmark styles the title and add a click event
  if(!isUndefined(item.bookmark) && item.bookmark.length > 0){
    titleSpan.className = "itemTitle bookmark";
    titleSpan.addEventListener("click",function(){
      // create a new tab and set its url to what they bookmarked
      chrome.tabs.create({"url":item.bookmark});
    });
  }
  // description
  var descSpan = document.createElement("span");
  descSpan.className = "itemDesc";
  descSpan.innerHTML = item.description;
  todoItem.appendChild(descSpan);

}


function storeItems(){
  // don't store the completed items
  var newlist = list.filter(function(item){
    return !item.complete;
  });
  chrome.storage.sync.set({"quickList":newlist}, function(){
    chrome.browserAction.setBadgeText({"text":""+newlist.length})
  });
}

function loadItems(){
  //grab the list from synced storage
  chrome.storage.sync.get("quickList", function(loadedList) {
    if(!isUndefined(loadedList))
      if(!isUndefined(loadedList.quickList))
        list = loadedList.quickList;
    refreshList();
  });
}

function refreshList(){
  deleteList();
  list.sort(itemCompare);
  // iterate the list and create a new todo list item for each item in the list
  for(var i=0; i< list.length;i++){
    createItem(list[i]);
  }
  chrome.browserAction.setBadgeText({"text":""+list.length})
}

function itemCompare(item1, item2){
  // compare the two items and work out which one comes first
  // completed items go last regardless
  //if(item1.complete && !item2.complete) return 1;
  //if(item2.complete && !item1.complete) return -1;
  // finally alphabetically
  if(item1.title < item2.title) return -1;
  return 1;
}

function deleteList(){
  quickList.innerHTML = "";
}

function completeItem(item){
  item.complete = true;
  refreshList();
  //need to store the list now
  storeItems();
}
function revertItem(item){
  item.complete = false;
  refreshList();
  //need to store the list now
  storeItems();
}
