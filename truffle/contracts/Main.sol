pragma solidity ^0.4.17;

contract Main {

    // Structure to hold details of Bidder
    struct IParticipant {
        // TODO
        address account;
        string fullname;
        string email;
        uint nSessions;
        uint deviation;
        bool isMember;
    }

    address[] public sessions;
    address public admin; // Admin account is the account deploy the main smart contract
    mapping(address => IParticipant) public participants;
    uint public nParticipants;
    uint public nSessions; // Get number of sessions
    address[] public iParticipants;
    
    // TODO: Variables

    constructor() public {
        admin = msg.sender;
    }


    // Add a Session Contract address into Main Contract. Use to link Session with Main
    function addSession(address _session) public {
        sessions.push(_session);
        nSessions ++;
    }

    function getAdmin() public returns(address) {
        return admin;
    }

    function getDeviation(address _address) public returns(uint) {
        return participants[_address].deviation;
    }

    function isMember(address _address) public returns(bool) {
        return participants[_address].isMember;
    }

    // Update participants information when closed session
    function updateInfor(address _address, uint _newDevi) public {
        uint _currentDevi = participants[_address].deviation;
        uint _nSessions = participants[_address].nSessions;
        uint _deviUpdate = (_currentDevi * _nSessions + _newDevi) / uint((_nSessions + 1));
        participants[_address].deviation = _deviUpdate;  // update deviation of participant
        participants[_address].nSessions ++;   // Update number session participant had join
    }

    // TODO: Functions
    /**
     *  Function register participant
     */
    function register(string memory _fullname, string memory _email) public {
        address _userAddress = msg.sender;
        if(!participants[_userAddress].isMember) {
            participants[_userAddress].isMember = true;
            participants[_userAddress].nSessions = 0;
            participants[_userAddress].deviation = 0;
            iParticipants.push(_userAddress);
            nParticipants ++;
        }
        participants[_userAddress].account = _userAddress;
        participants[_userAddress].fullname = _fullname;
        participants[_userAddress].email = _email;
    }
    // modifier -------------------

    // Only amdin can do this action.
    modifier onlyAdmin() {
        require(admin == msg.sender);
        _;
    }
}
