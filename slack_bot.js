//"StAuth10065: I Bohan Gou, 000360941 certify that this material is my original work.
// No other person's work has been used without due acknowledgement. I have not made my work available to anyone else."


//include all the files
const Bot = require('slackbots');
const application = require('./application.js');
const Application = require('./application.js');
const Yelp = require('./yelp.js');
const dotenv = require('dotenv').config();
//initial yelp
class SlackBot {
  constructor(handle = 'yelphelp') {
    this.handle = handle;
    this.ready = false;
    this.yelp = new Yelp();

    this.settings = {
      token: process.env.SLACK_TOKEN,
      name: this.handle
    }

    this.instance = new Bot(this.settings);

    this.instance.on('start', this.started.bind(this));
    this.instance.on('message', this.messaged.bind(this));
  }

  // Event callback for Slack API 'start' event
  started() {
    this.ready = true;
    console.log("SlackBot is ready.");
  }

  // Event callback for Slack API 'message' event
  messaged(data) {
    let sb = this; // Create a reference to "this" for later

    if (data.subtype) return; // We only want messages from a person

    // Check which type of data we are receiving
    switch (data.type) {

      // It's a 'message'
      case "message":
      let user_id_from = data.user; // The User ID of the person who sent us the message
      let command_regex = /(\w{0,}).+/gim;
      let command_processed = this.process_message_text(command_regex, data.text);
      let command = command_processed[Application.PROCESSED_TEXT_COMMAND].toLowerCase();

      // Get the user that sent this message first
      let user = this.get_user_by_id(user_id_from)
      .then((user) => {

        if (!user) return false; // No user? Stop everything!

        // Which command are we responding to?
        // nearby, events, top, closest, findme, reviews, searchbyphone, statusupdate
        switch (command) {

          case "nearby":
          let nearby_regex = /(\w{0,}) (\d(.){0,})/gim;
          let nearby_arguments_processed = this.process_message_text(nearby_regex, data.text);
          console.log(nearby_arguments_processed)

          //search the restaurant around the supplied address
          let NearByAddress = nearby_arguments_processed[2];
          if (data) {
            let formatted_message = `No restaurant found using that phone number`;
            this.yelp.get_nearby_restaurants_by_address(NearByAddress, 10000)
            .then(data => {
              let returned_data = JSON.parse(data);
              for (let i = 0; i < 5; i++) {
                // Convert data to JSON object
                if (returned_data.businesses[i]) { // We only want the first result, so let's make sure it exists
                  let restaurant = returned_data.businesses[i]; // Save a reference that's easier to refer to
                  //fotmat
                  formatted_message = `
                  *Hey <@${user_id_from}>, I think I found what you're looking for:*
                  > ${restaurant['name']}
                  > ${restaurant['location']['address1']}, ${restaurant['location']['city']}
                  > ${restaurant['phone']}`;
                }
                // Post the message to the channel, and tag the user that asked for it
                sb.post_to_channel('general', formatted_message);
              }
            })
          }
          break;
//search the around event by the supplied landtitude and longtitude
          case "events":
          let event_regex = /(\w{0,}) (\d(.){0,})(W|E) (\d(.){0,})(N|S)/gim;
          let events_arguments_processed = this.process_message_text(event_regex, data.text);
          console.log(events_arguments_processed);
          let EventLongLat = events_arguments_processed[1];
          if (data) {
            let formatted_message = `No event found using that location`;
            this.yelp.get_events_by_point(EventLongLat, 10000)
            .then(data => {
              let returned_data = JSON.parse(data);
              for (let i = 0; i < 5; i++) {
                if (returned_data.events[i]) {
                  let restaurant = returned_data.events[i]; // Save a reference that's easier to refer to
                  formatted_message = `
                  *Hey <@${user_id_from}>, I think I found what you're looking for:*
                  > ${restaurant['name']}
                  > ${restaurant['location']['address1']}, ${restaurant['location']['city']}
                  > ${restaurant['description']}`;
                }
                sb.post_to_channel('general', formatted_message);
              }
            })
          }
          break;
//search the top restaurants by the rating, the amount according to the x number,
          case "top":
          let top_regex = /(\w{0,}) (\d(.){0,})/gim;
          let top_arguments_processed = this.process_message_text(top_regex, data.text);
          console.log(top_arguments_processed);
          let TopX = top_arguments_processed[2];
          let top_address = top_arguments_processed[3];
          if (data) {
            let formatted_message = "No restaurant found";
            this.yelp.get_top_xnumber(10,TopX,10000)
            .then(data => {
              let returned_data = JSON.parse(data);
              for (let i=0;i<10;i++){
                if (returned_data.businesses[i]) {
                  let restaurant = returned_data.businesses[i];
                  formatted_message=`
                  *Hey <@${user_id_from}>, I think I found what you're looking for:*
                  > ${restaurant['name']}
                  > ${restaurant['location']['address1']}, ${restaurant['location']['city']}`;
                }
                sb.post_to_channel('general', formatted_message);
              }

            })
          }
          break;
//search the closest restaurants, according to the x number, the result is same as x
          case "closest":
          let closest_regex = /(\w{0,}) (\d(.){0,})/gim;
          let closest_arguments_processed = this.process_message_text(closest_regex, data.text);
          console.log(closest_arguments_processed);
          let ClosetX = closest_arguments_processed[2];
          let closest_address = closest_arguments_processed[3];
          if (data) {
            let formatted_message = "No restaurant found";
            this.yelp.get_top_xnumber(7,ClosetX,10000)
            .then(data => {
              let returned_data = JSON.parse(data);
              for (let i=0;i<7;i++){
                if (returned_data.businesses[i]) {
                  let restaurant = returned_data.businesses[i];
                  formatted_message=`
                  *Hey <@${user_id_from}>, I think I found what you're looking for:*
                  > ${restaurant['name']}
                  > ${restaurant['location']['address1']}, ${restaurant['location']['city']}`;
                }
                sb.post_to_channel('general', formatted_message);
              }

            })
          }
          break;
//search restaurant by category, and the closest restaurant
          case "findme":
          let findme_regex = /(\w{0,}) (\w*) (.*)/gim;
          let findme_arguments_processed = this.process_message_text(findme_regex, data.text);
          console.log(findme_arguments_processed);
          let FindmeCategory = findme_arguments_processed[2];
          let findme_address = findme_arguments_processed[3];
          if (data) {
            let formatted_message = `No restaurant found in this category`;
            this.yelp.get_restaurant_by_category(FindmeCategory,20000,findme_address)
            .then(data => {
              let returned_data = JSON.parse(data);
              if (returned_data.businesses[0]) {
                let restaurant = returned_data.businesses[0];
                formatted_message = `
                *Hey <@${user_id_from}>, I think I found what you're looking for:*
                > ${restaurant['name']}
                > ${restaurant['location']['address1']}, ${restaurant['location']['city']}
                > ${restaurant['categories']['alias']}`;
              }

              // sb.post_to_channel('general',  formatted_message);
              sb.post_to_channel('general', formatted_message);
            })
          }
          break;

          //search the review for any restaurant
          case "reviews":
          let reviews_regex = /(\w{0,}) (\w*) (.*)/gim;
          let reviews_arguments_processed = this.process_message_text(reviews_regex, data.text);
          console.log(reviews_arguments_processed);
          let ReviewsName = reviews_arguments_processed[2];
          let review_address = reviews_arguments_processed[3];
          if (data) {
            let formatted_message = `RestaurantName cannot be found`;

            this.yelp.get_restaurant_by_review(review_address)
            .then(data => {
              let returned_data = JSON.parse(data);
              if (returned_data.businesses[0]) {
                let restaurant = returned_data.businesses[0];
                formatted_message = `
                *Hey <@${user_id_from}>, I think I found what you're looking for:*
                > ${restaurant['name']}
                > ${restaurant['location']['address1']}, ${restaurant['location']['city']}
                > ${restaurant['id']}`;
                sb.post_to_channel('general', formatted_message);
                let id = ``;
                id = `${restaurant['id']}`;
                sb.post_to_channel('general', id);

              }
            })
          }
          break;



          // This is provided as an example to help you with the other commands
          // Expected input: SearchByPhone 19055555555
          case "searchbyphone":
          let sbp_regex = /(\w{0,}) (\d{0,11})/gim;
          console.log(sbp_regex);
          let arguments_processed = this.process_message_text(sbp_regex, data.text);
          console.log(arguments_processed)
          let phone_number = arguments_processed[Application.PROCESSED_TEXT_PHONE]; // Get phone number
          console.log(phone_number)
          let formatted_message = `No restaurant found using that phone number`; // Default message

          if (!phone_number) return false; // If no phone number is passed, we can stop here.
          // Use yelp.js to respond to the user's request:
          this.yelp.get_restaurant_by_phone_number(phone_number)
          .then(data => {
            // data will be an object or FALSE (error)
            if (data) {
              console.log(data)
              // Convert data to JSON object
              let returned_data = JSON.parse(data);

              if (returned_data.businesses[0]) { // We only want the first result, so let's make sure it exists
                let restaurant = returned_data.businesses[0]; // Save a reference that's easier to refer to
                //fotmat
                formatted_message = `
                *Hey <@${user_id_from}>, I think I found what you're looking for:*
                > ${restaurant['name']}
                > ${restaurant['location']['address1']}, ${restaurant['location']['city']}
                > ${restaurant['phone']}`;
              }
            }

            // Post the message to the channel, and tag the user that asked for it
            sb.post_to_channel('general', formatted_message);
          });
          break;

          // You'll have to code each type of "command"
          // case "nearby":
          //    // ...
          //    break;

        }
      })
      .catch((err) => {
        console.log(err);
        return false;
      });

      break;

    //  StatusUpdate Status Message
case "StatusUpdate Status Message":
await axios.post('http://localhost:3000/api', { status: 'New status', message: 'New message ', timestamp: '2020-10-30 00:00:01' })
        .then(res => {
            if (res) {
                test_positive.push(" 1 message was inserted in database");

                console.log('👍');
                console.log('CREATE ENTRY SUCCESSFUL');
            } else {
                test_negative.push("  1 message was inserted in database");
                console.log('👎');
            }
        })
        .catch(error => {
            test_negative.push(" ERROR");
        });
break;


    }
  }

  // Allows for posting to a specific channel
  post_to_channel(channel, message) {
    if (this.ready)
    this.instance.postMessageToChannel(channel, message);
  }

  // Allows for posting to a specific user
  post_to_user(username, message) {
    if (this.ready)
    this.instance.postMessageToUser(username, message);
  }

  // Get user information by UserID, from Slack API
  async get_user_by_id(user_id) {
    if (this.ready) {
      // https://npmdoc.github.io/node-npmdoc-slackbots/build/apidoc.html
      return this.instance.getUserById(user_id)
      .then((data) => {
        return data;
      })
      .catch((err) => {
        return false;
      });
    } else {
      return false
    }
  }

  process_message_text(regex, text) {
    let return_value = [];
    let matches;

    // First we check that there are matches with the supplied RegEx
    while ((matches = regex.exec(text)) !== null) {
      // Let's go through each match and add them to an array that we will return back to the caller
      // The first element in the array will contain the whole string, then each element after will
      // contain an argument in the string, that matches the RegEx pattern.
      // e.g.
      //  Text: 'SearchByPhone 19055555555'
      //  Response: ['SearchByPhone 1905555555', 'SearchByPhone', '1905555555']
      //  So if you want to get the phone number in this example, you'd want index 2
      for (let match = 0; match < matches.length; match++) {
        if (matches[match]) return_value.push(matches[match]);
      }
    }

    return return_value;
  }
}

module.exports = SlackBot;
