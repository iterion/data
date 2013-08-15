var get = Ember.get, set = Ember.set;
var env, Person, Phone, App;

module("integration/adapter/fixture_adapter - DS.FixtureAdapter", {
  setup: function() {
    Person = DS.Model.extend({
      firstName: DS.attr('string'),
      lastName: DS.attr('string'),

      height: DS.attr('number'),

      phones: DS.hasMany('phone')
    });

    Phone = DS.Model.extend({
      person: DS.belongsTo('person')
    });

    env = setupStore({ person: Person, phone: Phone, adapter: DS.FixtureAdapter });
    env.adapter.simulateRemoteResponse = true;

    // Enable setTimeout.
    Ember.testing = false;

    Person.FIXTURES = [];
    Phone.FIXTURES = [];
  },
  teardown: function() {
    Ember.testing = true;

    env.container.destroy();
  }
});

test("should load data for a type asynchronously when it is requested", function() {
  var timer = setTimeout(function() {
    start();
    ok(false, "timeout exceeded waiting for fixture data");
  }, 1000);

  Person.FIXTURES = [{
    id: 'wycats',
    firstName: "Yehuda",
    lastName: "Katz",

    height: 65
  },

  {
    id: 'ebryn',
    firstName: "Erik",
    lastName: "Brynjolffsosysdfon",

    height: 70,
    phones: [1, 2]
  }];

  Phone.FIXTURES = [{
    id: 1,
    person: 'ebryn'
  }, {
    id: 2,
    person: 'ebryn'
  }];

  stop();

  var ebryn = env.store.find('person', 'ebryn');

  equal(get(ebryn, 'isLoaded'), false, "record from fixtures is returned in the loading state");

  ebryn.then(function() {
    clearTimeout(timer);
    start();

    ok(get(ebryn, 'isLoaded'), "data loads asynchronously");
    equal(get(ebryn, 'height'), 70, "data from fixtures is loaded correctly");
    equal(get(ebryn, 'phones.length'), 2, "relationships from fixtures is loaded correctly");

    stop();

    var wycats = env.store.find('person', 'wycats');
    wycats.then(function() {
      clearTimeout(timer);
      start();

      equal(get(wycats, 'isLoaded'), true, "subsequent requests for records are returned asynchronously");
      equal(get(wycats, 'height'), 65, "subsequent requested records contain correct information");
    });

    timer = setTimeout(function() {
      start();
      ok(false, "timeout exceeded waiting for fixture data");
    }, 1000);
  });
});

test("should load data asynchronously at the end of the runloop when simulateRemoteResponse is false", function() {
  Person.FIXTURES = [{
    id: 'wycats',
    firstName: "Yehuda"
  }];

  env.adapter.simulateRemoteResponse = false;

  var wycats;

  Ember.run(function() {
    wycats = env.store.find('person', 'wycats');
    ok(!get(wycats, 'isLoaded'), 'isLoaded is false initially');
    ok(!get(wycats, 'firstName'), 'record properties are undefined initially');
  });

  ok(get(wycats, 'isLoaded'), 'isLoaded is true after runloop finishes');
  equal(get(wycats, 'firstName'), 'Yehuda', 'record properties are defined after runloop finishes');
});

test("should create record asynchronously when it is committed", function() {
  expect(9);
  stop();

  var timer = setTimeout(function() {
    start();
    ok(false, "timeout exceeded waiting for fixture data");
  }, 1000);

  equal(Person.FIXTURES.length, 0, "Fixtures is empty");

  var paul = env.store.createRecord('person', {firstName: 'Paul', lastName: 'Chavard', height: 70});

  paul.on('didCreate', function() {
    clearTimeout(timer);
    start();

    equal(get(paul, 'isNew'), false, "data loads asynchronously");
    equal(get(paul, 'isDirty'), false, "data loads asynchronously");
    equal(get(paul, 'height'), 70, "data from fixtures is saved correctly");

    equal(Person.FIXTURES.length, 1, "Record added to FIXTURES");

    var fixture = Person.FIXTURES[0];

    equal(fixture.id, Ember.guidFor(paul));
    equal(fixture.firstName, 'Paul');
    equal(fixture.lastName, 'Chavard');
    equal(fixture.height, 70);
  });

  paul.save();
});

test("should update record asynchronously when it is committed", function() {
  stop();

  var timer = setTimeout(function() {
    start();
    ok(false, "timeout exceeded waiting for fixture data");
  }, 1000);

  equal(Person.FIXTURES.length, 0, "Fixtures is empty");

  var paul = env.store.push('person', { id: 1, firstName: 'Paul', lastName: 'Chavard', height: 70});

  paul.set('height', 80);

  paul.on('didUpdate', function() {
    clearTimeout(timer);
    start();

    equal(get(paul, 'isDirty'), false, "data loads asynchronously");
    equal(get(paul, 'height'), 80, "data from fixtures is saved correctly");

    equal(Person.FIXTURES.length, 1, "Record FIXTURES updated");

    var fixture = Person.FIXTURES[0];

    equal(fixture.firstName, 'Paul');
    equal(fixture.lastName, 'Chavard');
    equal(fixture.height, 80);
  });

  paul.save();
});

test("should delete record asynchronously when it is committed", function() {
  stop();

  var timer = setTimeout(function() {
    start();
    ok(false, "timeout exceeded waiting for fixture data");
  }, 1000);

  equal(Person.FIXTURES.length, 0, "Fixtures empty");

  var paul = env.store.push('person', { id: 'paul', firstName: 'Paul', lastName: 'Chavard', height: 70 });

  paul.deleteRecord();

  paul.on('didDelete', function() {
    clearTimeout(timer);
    start();

    equal(get(paul, 'isDeleted'), true, "data deleted asynchronously");
    equal(get(paul, 'isDirty'), false, "data deleted asynchronously");

    equal(Person.FIXTURES.length, 0, "Record removed from FIXTURES");
  });

  paul.save();
});

test("should follow isUpdating semantics", function() {
  var timer = setTimeout(function() {
    start();
    ok(false, "timeout exceeded waiting for fixture data");
  }, 1000);

  stop();

  Person.FIXTURES = [{
    id: "twinturbo",
    firstName: "Adam",
    lastName: "Hawkins",
    height: 65
  }];

  var result = env.store.findAll('person');

  result.then(function(all) {
    clearTimeout(timer);
    start();
    equal(get(all, 'isUpdating'), false, "isUpdating is set when it shouldn't be");
  });
});

test("should coerce integer ids into string", function() {
  var timer = setTimeout(function() {
    start();
    ok(false, "timeout exceeded waiting for fixture data");
  }, 1000);

  stop();

  Person.FIXTURES = [{
    id: 1,
    firstName: "Adam",
    lastName: "Hawkins",
    height: 65
  }];

  var result = env.store.find('person', 1);

  result.then(function() {
    clearTimeout(timer);
    start();
    clearTimeout(timer);
    strictEqual(get(result, 'id'), "1", "should load integer model id as string");
  });
});

test("should coerce belongsTo ids into string", function() {
  var timer = setTimeout(function() {
    start();
    ok(false, "timeout exceeded waiting for fixture data");
  }, 1000);

  stop();

  Person.FIXTURES = [{
    id: 1,
    firstName: "Adam",
    lastName: "Hawkins",

    phones: [1]
  }];

  Phone.FIXTURES = [{
    id: 1,
    person: 1
  }];

  var result = env.store.find('phone', 1);

  result.then(function() {
    var person = get(result, 'person');
    person.on('didLoad', function() {
      clearTimeout(timer);
      start();
      strictEqual(get(result, 'person.id'), "1", "should load integer belongsTo id as string");
      strictEqual(get(result, 'person.firstName'), "Adam", "resolved relationship with an integer belongsTo id");
    });
  });

});

test("only coerce belongsTo ids to string if id is defined and not null", function() {
  stop();

  Person.FIXTURES = [];

  Phone.FIXTURES = [{
    id: 1
  }];

  env.store.find('phone', 1).then(function(phone) {
    clearTimeout(timer);
    start();
    equal(phone.get('person'), null);
  });

  var timer = setTimeout(function() {
    start();
    ok(false, "timeout exceeded waiting for fixture data");
  }, 1000);
});

test("should throw if ids are not defined in the FIXTURES", function() {
  Person.FIXTURES = [{
    firstName: "Adam",
    lastName: "Hawkins",
    height: 65
  }];

  raises(function(){
    env.store.find('person', 1);
  }, /the id property must be defined as a number or string for fixture/);

  Person.FIXTURES = [{
    id: 0
  }];
  var result;
  stop();
  try {
    result = env.store.find('person', 0);
    // should accept 0 as an id, all is fine
    result.then(function() {
      clearTimeout(timer);
      start();
    });
    var timer = setTimeout(function() {
      start();
      ok(false, "timeout exceeded waiting for fixture data");
    }, 1000);
  } catch (err) {
    ok(false, "model with id of zero raises undefined id error");
    start();
  }
});