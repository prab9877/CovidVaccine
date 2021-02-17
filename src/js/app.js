App = {

  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    if(typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'){
      //getting Permission to access. This is for when the user has new MetaMask
      window.ethereum.enable();
      App.web3Provider = window.ethereum;
      web3 = new Web3(window.ethereum);
    
    }else if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
      web3 = new Web3(window.web3.currentProvider);
      // Acccounts always exposed. This is those who have old version of MetaMask
    
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
      web3 = new Web3(App.web3Provider);
    
    }
    
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("VaccineControl.json", function(vaccine) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.VaccineControl = TruffleContract(vaccine);
      // Connect provider to interact with contract
      App.contracts.VaccineControl.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.VaccineControl.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.statusEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event);
        var statusCode = event.args.statusCode["c"][0];
        
        if (statusCode == 101 || statusCode == 100){
          App.render();
        }
      });
    });
  },

  render: function() {
    var vaccineControl;
    // Load account data
    console.log("load");
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Account: " + account);
        console.log(App.account);
      }
    });

    // Load contract data
    App.contracts.VaccineControl.deployed().then(function(instance) {
      vaccinePerson = instance;
      return vaccinePerson.getPerson();
    }).then(function(person) {
      console.log(person);
      $("#firstNameInput").val(person[0]);
      $("#lastNameInput").val(person[1]);

    }).catch(function(error) {
      console.warn(error);
    });

    vaccineList = [{1: "Measles"}, {2: "Flu"}, {3: "Tetanus"}]

    vaccineList.forEach(function(dict, chave){
      for (var key in dict) {
        App.contracts.VaccineControl.deployed().then(function(instance) {
          vaccinePerson = instance;
          return vaccinePerson.getVaccine(key);
        }).then(function(vaccine) {
          var dose = vaccine[0]["c"][0];
          var batch = vaccine[1];
          var place = vaccine[2];

          console.log(vaccine);
          console.log(dose);
          console.log(batch);
          console.log(place);
    
          if (dose > 0) {
            $("#span"+dict[key]).text("VACCINED");
            $("#span"+dict[key]).attr("class", "label label-success");
            $("#list"+dict[key]).attr("class", "list-group-item list-group-item-success");
          }
    
          $("#lote"+dict[key]).text("Batch " + batch);
          $("#dose"+dict[key]).text("Dose " + dose);
          $("#place"+dict[key]).text(place);
    
        }).catch(function(error) {
          console.warn(error);
        });
      }
    });
  },

  addPerson: function() {
    console.log("New person adding...");

    var firstName = $('#firstNameInput').val();
    var lastName = $('#lastNameInput').val();

    console.log(App.account);

    App.contracts.VaccineControl.deployed().then(function(instance) {
      return instance.addPerson(firstName, lastName, { from: App.account });
    }).then(function(result) {
      console.log("New person added.")
      $("#alertPerson.alert").toggleClass('in'); 
    }).catch(function(err) {
      console.error(err);
    });
  },

  addVaccine: function() {
    console.log("New vaccine adding...");

    var id_vaccine = $('#VaccineSelect').val();
    var dose = $('#DoseSelect').val();
    var batch = $('#BatchInput').val();
    var place = $('#PlaceInput').val();

    App.contracts.VaccineControl.deployed().then(function(instance) {
      return instance.addVaccine(id_vaccine, dose, batch, place, { from: App.account });
    }).then(function(result) {
      console.log("New vaccine added.")
      $("#alertVaccine.alert").toggleClass('in'); 
    }).catch(function(err) {
      console.error(err);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
