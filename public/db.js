let db;
const request = window.indexedDB.open("budget", 1);

// create schema
request.onupgradeneeded = (event) => {
    // Creates an object store with a listID keypath that can be used to query on.
    event.target.result.createObjectStore("pending", { 
        keyPath: "id",
        autoIncrement: true 
    });
};

request.onerror = function (error) {
    console.log("Something went wrong here:" + error.message);
};

// opens a transaction with 
request.onsuccess = function(event) {
    db = event.target.result;
    //check if we are online before reading from db
    if (navigator.onLine) {
        checkDatabase();
    }
};

//this is called when app is offline and user saves a transaction
function saveRecord (record) {
    //create a transaction on the pending db with r/w access
    const transaction = db.transaction ("pending", "readwrite");
    const store = transaction.objectStore("pending");
    store.add(record);
}

//when app is online we run this
function checkDatabase() {
    //open a transaction on the pending db
    const transaction = db.transaction("pending", "readwrite");
    const store = transaction.objectStore("pending");
    // get all records from store
    const getAllRecords = store.getAll();

    getAllRecords.onsuccess = function () {
        if (getAllRecords.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAllRecords.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
            .then(response => response.json())
            .then(() => {
                //if success then open a transaction on pending db
                const transaction = db.transaction(["pending"], "readwrite");
                const store = transaction.objectStore("pending");
                store.clear();
            });
        }
    };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);