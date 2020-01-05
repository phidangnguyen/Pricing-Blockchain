pragma solidity ^0.4.17;
// Interface of Main contract to call from Session contract
contract Main {
    // Structure to hold details of Bidder
    function addSession(address _session) public {}
    function getAdmin() public view returns(address) {}
    function getDeviation(address _address) public view returns(uint) {}
    function updateInfor(address _address, uint _newDevi) public {}
    function isMember(address _address) public view returns(bool) {}
}

contract Session {
    // Variable to hold Main Contract Address when create new Session Contract
    address public mainContract;
    address public sessionContract;
    // Variable to hold Main Contract instance to call functions from Main
    Main MainContract;
    // TODO: Variable
    enum StateOfSession { STARTED, STOPED, PRICING, CLOSED }
    StateOfSession public state = StateOfSession.STARTED;
    address public admin;
    // Struct to hold details information of participant join pricing
    struct IParticipant {
        address account;
        uint deviation;
        uint price;
    }

    // List contain all account join pricing session.
    address[] public iParticipants;
    mapping(address => IParticipant) public participant;
    uint public nParticipants = 0;
    // Struct to hold details of product
    struct Product {
        address id;
        string name;
        string description;
        string image;
        uint price;
        StateOfSession status;
    }

    Product public product;

    constructor(address _mainContract, string memory _name, string memory _description, string memory _image) public {
        mainContract = _mainContract;
        sessionContract = address(this);
        // Get Main Contract instance
        MainContract = Main(_mainContract);
        admin = MainContract.getAdmin();
        // TODO: Init Session contract
        // Call Main Contract function to link current contract.
        MainContract.addSession(sessionContract);
        addProduct(_name, _description, _image);
    }

    // TODO: Functions

    // Add new product
    function addProduct(string memory _name, string memory _description, string memory _image)
        public onlyAdmin(){
        // Add information for product
        product.name = _name;
        product.description = _description;
        product.image = _image;
        product.id = sessionContract;
        product.status = state;
    }

    /**
     *  Just only admin can be stop pricing session.
     *  And current state is not pricing
     */
    function stopSession() public statePricing() onlyAdmin() {
        state = StateOfSession.STOPED;
        product.status = StateOfSession.STOPED;
    }

    /**
     * Just only admin can be start pricing session.
     * And current state is started
     */
    function startSession() public stateStarted() onlyAdmin() {
        state = StateOfSession.PRICING;
        product.status = StateOfSession.PRICING;
    }

    /**
     * For participant pricing product when session started
    */
    function pricing(uint _price) public statePricing() {
        address _address = msg.sender;
        // Only member had been register just can pricing
        require(MainContract.isMember(_address));
        // For participant have the pricing first time;
        if(participant[_address].account != _address) {
            uint _deviation = MainContract.getDeviation(_address);
            participant[_address].account = _address;
            participant[_address].deviation = _deviation;
            iParticipants.push(_address);
            nParticipants ++;
        }
        participant[_address].price = _price;
    }

    /**
     * Clossing session when session had been stoped, and only admin can do
     */
    function closeSession() public onlyAdmin() stateStoped() {
        state = StateOfSession.CLOSED;
        product.status = StateOfSession.CLOSED;
        uint _fPrice = calPrice(); // Calculate final price of project
        product.price = _fPrice;
        for(uint i = 0; i < nParticipants; i++) {
            address _address = iParticipants[i]; // Address of participant
            uint _uPrice =  participant[_address].price; //  Price of participant had been price for product
            uint _newDevi = calDeviationNew(_uPrice, _fPrice);
            MainContract.updateInfor(_address, _newDevi);
        }
    }

    // Calculate proposed base on formula povider
    function calPrice() private view returns (uint) {
        if(nParticipants == 0) {
            return 0;
        }
        uint _numerator;
        uint _denominator;
        for(uint i = 0; i < nParticipants; i++) {
            address _address = iParticipants[i]; // Address of participant
            uint _price =  participant[_address].price; //  Price of participant had been price for product
            uint _deviation = participant[_address].deviation; // Deviation of participant
            _numerator += _price * (100 - _deviation);
            _denominator += _deviation;
        }
        _denominator = 100 * nParticipants - _denominator;
        return _numerator/ uint(_denominator);
    }

    // Calculate new deviation for participant via current session
    function calDeviationNew(uint _uPrice, uint _fPrice) private pure returns (uint) {
        uint _numerator;
        if (_uPrice > _fPrice) {
            _numerator = _uPrice - _fPrice;
        } else {
            _numerator = _fPrice - _uPrice;
        }
        return _numerator * 100 / uint(_fPrice);
    }

    /**
     * Modifier had used ----------------------- /////
    */
    // Only admin can do those actions.
    modifier onlyAdmin() {
        require(admin == msg.sender);
        _;
    }
    // Only action when state is STATED
    modifier stateStarted() {
        require(state == StateOfSession.STARTED);
        _;
    }
    // Only action when state is PRICING
    modifier statePricing() {
        require(state == StateOfSession.PRICING);
        _;
    }
     // Only action when state is CLOSED
    modifier stateStoped() {
        require(state == StateOfSession.STOPED);
        _;
    }
}

