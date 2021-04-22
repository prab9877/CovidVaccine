pragma solidity >0.4.23;

contract VaccineControl {
    
    event statusEvent(uint indexed statusCode);
    struct Operator {
        address operatorAddress;
        string firstName;
        string lastName;
        
    }

    struct Person {
        string adhar;
        string firstName;
        string lastName;
        
        string age;
        string mobile;
        string email;
        string vaccineName;
        string dose;
    }
    Person[] persons;
    uint256 covishield=0;
    uint256 covaxin=0;
    uint256 personcount=0;
    mapping (address => Operator) private operators;
    
    function addPerson(string memory _adhar,string memory _firstName, string memory _lastName,string memory _age,string memory _mobile,string memory _email,string memory _vaccineName) public returns (bool) {
        
        address _address = msg.sender;
        
        
        persons.push(Person(_adhar,_firstName,_lastName,_age,_mobile,_email,_vaccineName,"1"));
        if((keccak256(abi.encodePacked(_vaccineName)))==(keccak256(abi.encodePacked("Covaxin"))))
        covaxin++;
        else
        covishield++;

        personcount++;
        emit statusEvent(100);
        
        return true;
    }
    function updatePerson(string memory _adhar) public returns (bool) {
    
        for(uint256 i;i<persons.length;i++){
            if(keccak256(abi.encodePacked(persons[i].adhar)) ==keccak256(abi.encodePacked(_adhar))){    
                persons[i].dose="2";
                 if((keccak256(abi.encodePacked(persons[i].vaccineName)))==(keccak256(abi.encodePacked("Covaxin"))))
                    covaxin++;
                else
                    covishield++;
            }
        }
        
        
        emit statusEvent(100);
        
        return true;
    }
    function getStats() public view returns ( uint256,uint256,uint256){
        return (personcount,covaxin,covishield);
    }

    function getPerson(string memory _adhar) public view returns (string memory,string memory){
        address _address =msg.sender;
        
        for(uint256 i;i<persons.length;i++){
            if(keccak256(abi.encodePacked(persons[i].adhar)) ==keccak256(abi.encodePacked(_adhar)))return (persons[i].dose,persons[i].vaccineName);

        }
        
        return ("3","null");
    }
    
   
       
}