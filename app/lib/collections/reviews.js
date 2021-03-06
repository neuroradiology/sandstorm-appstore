Reviews = new Mongo.Collection('reviews');

Reviews.rating = {
  broken: 0,
  didntLike: 1,
  jobDone: 2,
  amazing: 3
};
Reviews.invertedRating = _.invert(Reviews.rating);

Schemas.Reviews = new SimpleSchema({
  appId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    index: true
  },
  userId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    index: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 3
  },
  text: {
    type: String,
    max: 500
  },
  createdAt: {
    type: Date,
    autoValue: function() {
      return new Date();
    },
    optional: true
  }
});

Reviews.attachSchema(Schemas.Reviews);

function propagateReview(userId, review) {

  var updateUser = {},
      updateApp = {},
      user = Meteor.users.findOne(review.userId);
  updateUser['reviews.' + review.appId] = review;
  Meteor.users.update(review.userId, {$set: updateUser});
  if (user) review.username = user.username;
  updateApp['reviews.' + review.userId] = review;
  Apps.update(review.appId, {$set: updateApp});

}

function removeReview(userId, review) {

  var updateUser = {},
      updateApp = {};
  updateUser['reviews.' + review.appId] = true;
  updateApp['reviews.' + review.userId] = true;
  Meteor.users.update(review.userId, {$unset: updateUser});
  Apps.update(review.appId, {$unset: updateApp});
}

Reviews.after.insert(propagateReview);
Reviews.after.update(propagateReview, {fetchPrevious: false});
Reviews.after.remove(removeReview);

if (Meteor.isServer) {
  Reviews.allow({
    insert: function (userId, doc) {
      return false;
    },

    update: function (userId, doc, fieldNames, modifier) {
      return false;
    },

    remove: function (userId, doc) {
      return false;
    }
  });

  Reviews.deny({
    insert: function (userId, doc) {
      return true;
    },

    update: function (userId, doc, fieldNames, modifier) {
      return true;
    },

    remove: function (userId, doc) {
      return true;
    }
  });
}
