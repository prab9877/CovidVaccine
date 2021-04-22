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
      App.showStats();
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

    },
  addPerson: function() {
    //clearing
    document.myform.aadharNumberInput.style.borderColor="black";
    document.myform.firstNameInput.style.borderColor="black";
    document.myform.lastNameInput.style.borderColor="black";
    document.myform.ageInput.style.borderColor="black";
    document.myform.mobInput.style.borderColor="black";
    document.myform.emailInput.style.borderColor="black";

    console.log("New person adding...");
    var adhar = $('#aadharNumberInput').val();
    var firstName = $('#firstNameInput').val();
    var lastName = $('#lastNameInput').val();
    var age = $('#ageInput').val();
    var mobile = $('#mobInput').val();
    var email = $('#emailInput').val();
    var vaccineName = document.querySelector(   
      'input[name="vaccineType"]:checked').value;   
    var dose = document.querySelector(   
        'input[name="dose"]:checked').value;   
    

    console.log(App.account);
    
    //Empty check
    if(adhar==""){
      alert("Adhar number is missing");
      document.myform.aadharNumberInput.style.borderColor="red";
      return false;
    }
    if(firstName==""){
      alert("First Name is missing");
      document.myform.firstNameInput.style.borderColor="red";
      return false;
    }
    if(lastName==""){
      alert("Last Name is missing");
      document.myform.lastNameInput.style.borderColor="red";
      return false;
    }
    if(age==""){
      alert("Age is missing");
      document.myform.ageInput.style.borderColor="red";
      return false;
    }
    if(mobile==""){
      alert("Mobile no. is missing");
      document.myform.mobInput.style.borderColor="red";
      return false;
    }
    if(email==""){
      alert("Email id is missing");
      document.myform.emailInput.style.borderColor="red";
      return false;
    }

    if(isNaN(adhar)){
      alert("Adhar id should be numeric");
      document.myform.aadharNumberInput.style.borderColor="red";
      return false;

    }
    if(isNaN(age)){
      alert("Age should be numeric");
      document.myform.ageInput.style.borderColor="red";
      return false;
    }
    if(isNaN(mobile)||mobile.length!=2){
      alert("Invalid Mobile number");
      document.myform.mobInput.style.borderColor="red";
      return false;
    }

    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(!re.test(email)){
      alert("Invalid Email id");
      document.myform.emailInput.style.borderColor="red";
      return false;
    }

    App.contracts.VaccineControl.deployed().then(function(instance){
      return instance.getPerson(adhar,{from: App.account });
    }).then(function(result){
      console.log(result);
      if(result[0]!="3"){
          if(dose=="1"||result[0]=="2"){
            alert("Adhar id already used!");
            document.myform.aadharNumberInput.style.borderColor="red";
            return false;
        }
        else{
          if(result[1]!=vaccineName){
            alert("Please give the patient the following vaccine for 2nd dose : "+result[1]);
            return false;
          }
          App.contracts.VaccineControl.deployed().then(function(instance) {
            return instance.updatePerson(adhar,{ from: App.account });
          }).then(function(result){
            App.showStats();
            alert("2nd dose completed");
            var templateParams = {
              to_name: firstName+" "+lastName,
              vaccine_name: vaccineName,
              to_email: email,
              dose : "2"
            };

            emailjs.send('service_n4h8vlq', 'template_xtz0kcd', templateParams)
            .then(function(response) {
              alert("Email sent successfully");
              console.log('SUCCESS!', response.status, response.text);
            }, function(error) {
              console.log('FAILED...', error);
            });

            document.myform.reset(); 


  

          })
          .catch(function(err){})
        }
      }
      
      else{
        if(dose=="2"){
          alert("1st dose still not completed");
          return false;
        }
        App.contracts.VaccineControl.deployed().then(function(instance) {
          return instance.addPerson(adhar,firstName, lastName,age,mobile,email,vaccineName ,{ from: App.account });
        }).then(function(result) {
          alert("New person added.");
          App.showStats();
          var templateParams = {
            to_name: firstName+" "+lastName,
            vaccine_name: vaccineName,
            to_email: email,
            dose: "1"
          };

          emailjs.send('service_n4h8vlq', 'template_xtz0kcd', templateParams)
          .then(function(response) {
            alert("Email sent successfully");
            console.log('SUCCESS!', response.status, response.text);
          }, function(error) {
            console.log('FAILED...', error);
          });

          document.myform.reset(); 
        }).catch(function(err) {
          console.error(err);
        });
      }

    }).catch(function(err){
      console.error(err);
    })


    

    
  },



  search: function() {
    console.log("searching");
    var adhar=$('#searchadhar').val();
    App.contracts.VaccineControl.deployed().then(function(instance){
      return instance.getPerson(adhar,{from: App.account });
    }).then(function(result){
      if(result[0]!="3"){
        if(result[0]=="1"){
          alert("Person is Vaccinated with 1 dose " );
        }
        else{
          alert("Person is Vaccinated with 2 doses" );
        }
      }
      else{
        alert("Person is not vaccinated")
      }
    }).catch(function(err){
      console.error(err);
    })
  
  },
  showStats:function(){
    App.contracts.VaccineControl.deployed().then(function(instance){
      return instance.getStats({from: App.account });
    }).then(function(result){
     console.log(result);
     document.getElementById("peoplecount").innerText=result[0];
     document.getElementById("covaxincount").innerText=result[1];
     document.getElementById("covishieldcount").innerText=result[2];
    }).catch(function(err){
      console.error(err);
    })
  }
};

$(function() {
  $(window).load(function() {
    App.init();
   
  });
});
$(function(){
  emailjs.init("user_KpE0FbnXWSstpTKpyI7SD");
});
