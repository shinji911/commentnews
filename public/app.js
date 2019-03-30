function getArticles() {
  $("#articles").empty();
  $("#comments").empty();
  $.getJSON("/articles", function (data) {    
    for (let i = 0; i < data.length; i++) {
      $("#articles").prepend("<button class='viewComment' data-id='" + data[i]._id + "'> View Comments </button>");
      $("#articles").prepend("<h3>" + data[i].title + "</h3> <br />" + data[i].link + "<br />" + data[i].summary + "</p>");      
    }
  });
};

getArticles();

$(document).on("click", "#scrape", function () {
  $.ajax({
    method: "GET",
    url: "/scrape"
  }).then(function () {
    getArticles();
  });
});

$(document).on("click", ".viewComment", function () {
  $("#comments").empty();
  let thisId = $(this).attr("data-id");
  viewComment(thisId);  
});

function viewComment(id) {  
  $.ajax({
    method: "GET",
    url: "/articles/" + id
  }).then(function (data) {
    console.log(data);
    $("#comments").append("<h3>" + data.title + "</h3>");
    if (data.comments) {
      for (let i = 0; i < data.comments.length; i++) {
        $("#comments").append("<h4>" + data.comments[i].title + "</h4>");
        $("#comments").append("<p>" + data.comments[i].body + "</p>");
      }
    }
    $("#comments").append("<input id='titleinput' name='title' >");
    $("#comments").append("<textarea id='bodyinput' name='body'></textarea>");
    $("#comments").append("<button data-id='" + data._id + "' id='savecomment'>Save Comment</button>");
  });
};

$(document).on("click", "#savecomment", function () {
  let thisId = $(this).attr("data-id");

  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      title: $("#titleinput").val(),
      body: $("#bodyinput").val()
    }
  }).then(function (data) {
    console.log(data);
    $("#comments").empty();
  }).then(function() {
    viewComment(thisId);
  });

  $("#titleinput").val("");
  $("#bodyinput").val("");
});
