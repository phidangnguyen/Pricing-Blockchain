import { app, h } from 'hyperapp';
import { Link, Route, location } from '@hyperapp/router';
import { Products } from './pages/products';
import { Sidebar } from './pages/sidebar';
import { Participants } from './pages/participants';
import { config } from './config';
import { promisify } from 'util';
import './css/vendor/bootstrap.css';
import './css/vendor/coreui.css';
import './css/index.css';
import $ from 'jquery';

const Fragment = (props, children) => children;

const Web3 = require('web3');
let web3js;

if (typeof web3js !== 'undefined') {
  web3js = new Web3(web3.currentProvider);
} else {
    web3js = new Web3(window.ethereum);
  // console.log('ws://localhost:7545')
}

import Main from './contracts/Main.json';
import Session from './contracts/Session.json';
ethereum.on('accountsChanged', function (accounts) {
  window.location.replace('/');
});

const mainContract = new web3js.eth.Contract(Main.abi, config.mainContract);


var state = {
  count: 1,
  location: location.state,
  products: [],
  dapp: {},
  balance: 0,
  account: 0,
  admin: null,
  profile: {},
  fullname: '',
  email: ''.replace,
  newProduct: {},
  sessions: [],
  currentProductIndex: 0,
  message: ''
};

// Functions of Main Contract
const contractFunctions = {
  getAccounts: promisify(web3js.eth.getAccounts),
  getBalance: promisify(web3js.eth.getBalance),

  // TODO: The methods' name is for referenced. Update to match with your Main contract

  // Get Admin address of Main contract
  getAdmin: mainContract.methods.getAdmin().call,

  // Get participant by address
  participants: address => mainContract.methods.participants(address).call,

  // Get number of participants
  nParticipants: mainContract.methods.getNParti().call,

  // Get address of participant by index (use to loop through the list of participants) 
  iParticipants: index => mainContract.methods.getIParti(index).call,

  // Register new participant
  register: async (fullname, email, account) => {
    let gasAmount = await mainContract.methods.register(fullname, email).estimateGas({from: account});
    await mainContract.methods.register(fullname, email).send({from: account, gas: gasAmount});
  },
  // Get number of sessions  
  nSessions: mainContract.methods.nSessions().call,

  // Get address of session by index (use to loop through the list of sessions) 
  sessions: index => mainContract.methods.sessions(index).call
};

const actions = {
  inputProfile: ({ field, value }) => state => {
    let profile = state.profile || {};
    profile[field] = value;
    return {
      ...state,
      profile
    };
  },

  inputNewProduct: ({ field, value }) => state => {
    let newProduct = state.newProduct || {};
    newProduct[field] = value;
    return {
      ...state,
      newProduct
    };
  },

  createProduct: () => async (state, actions) => {
    let contract = new web3js.eth.Contract(Session.abi, {
      data: Session.bytecode
    });
    let params = [
      config.mainContract.toString(),
      state.newProduct.name,
      state.newProduct.description,
      state.newProduct.image
      ];
    let admin = await contractFunctions.getAdmin();
    try {
      let gasAmount = await contract.deploy({arguments: params}).estimateGas({from: admin});
      await contract.deploy({arguments: params}).send({ from: admin, gas: gasAmount });
      actions.setMessage('Action Success, Create product success.');
      actions.showAlertMessage('success');
    } catch (error) {
      actions.setMessage('Action failed, Create product failed.');
      actions.showAlertMessage('error');
    }
    actions.getSessions();
  },

  selectProduct: i => state => {
    return {
      currentProductIndex: i
    };
  },

  sessionFn: (data) => async (state, actions) => {
    const session = state.sessions[state.currentProductIndex].contract['_address'];
    const sessionContract = new web3js.eth.Contract(Session.abi, session);
    
    let gasAmount = 0;

    switch (data.action) {
      case 'start':
        //TODO: Handle event when User Start a new session
        try {
          let timeOut = 0;
          let account = state.account;
          if(data.time && Number(data.time)) {
            timeOut = Number(data.time) * 60;
          }
          gasAmount = await sessionContract.methods.startSession(timeOut).estimateGas({from: account});
          await sessionContract.methods.startSession(timeOut).send({from: account, gas: (gasAmount || 3000)});
          actions.setMessage('Action Success, Pricing session was started.');
          actions.showAlertMessage('success');
        } catch (error) {
          actions.setMessage('Action Failed, Can not start session.');
          actions.showAlertMessage('error');
        }
        actions.getSessions();
        break;
      case 'stop':
        //TODO: Handle event when User Stop a session
        try {
          gasAmount = await sessionContract.methods.stopSession().estimateGas({from: state.account});
          await sessionContract.methods.stopSession().send({from: state.account, gas: (gasAmount || 3000)});
          actions.setMessage('Action Success, Pricing session was stoped.');
          actions.showAlertMessage('success');
        } catch (error) {
          actions.setMessage('Action Failed, Can not stop session.');
          actions.showAlertMessage('error');
        }
        actions.getSessions();
        break;
      case 'pricing':
        //TODO: Handle event when User Pricing a product
        //The inputed Price is stored in `data`
        try {
          let price = data.price;
          let expired;
          
          gasAmount = await sessionContract.methods.pricing(price).estimateGas({from: state.account});
          await sessionContract.methods.pricing(price).send({from: state.account, gas: (gasAmount || 3000)});
          
          await sessionContract.getPastEvents('SessionExpiredEvent', (error, event) => {
            if(event && event[0].returnValues && event[0].returnValues[0]) expired = event[0].returnValues[0];
            if(expired) {
              actions.setMessage('Pricing session of product expired.');
              actions.showAlertMessage('error');
            } else {
              actions.setMessage('Action Success, Your pricing success.');
              actions.showAlertMessage('success');
            }
          });
        } catch (error) {
          if(!state.profile.isMember) {
            actions.setMessage('Action Failed, Can not pricing product. You have to be member.');
          } else{
            actions.setMessage('Action Failed, Can not pricing product.');
          }
          actions.showAlertMessage('error');
        }
        actions.getSessions();
        break;
      case 'close':
        //TODO: Handle event when User Close a session
        //The inputed Price is stored in `data`
        try {
          gasAmount = await sessionContract.methods.closeSession().estimateGas({from: state.account});
          await sessionContract.methods.closeSession().send({from: state.account, gas: (gasAmount || 3000)});
          actions.setMessage('Action Success, Pricing session was closed.');
          actions.showAlertMessage('success');
          window.location.reload(false);
        } catch (error) {
          actions.setMessage('Action Failed, Can not closing session.');
          actions.showAlertMessage('error');
        }
        actions.getSessions();
        break;
    }
  },

  location: location.actions,

  getAccount: () => async (state, actions) => {
    let accounts = await window.ethereum.enable();
    let account = accounts[0];
    let balance = await contractFunctions.getBalance(account);
    let admin = await contractFunctions.getAdmin();
    let profile = await contractFunctions.participants(account)();
    if(!profile.isMember) {
      actions.setMessage('You are not member! Now, you should to register.');
      actions.showAlertMessage('info', true);
    }
    
    actions.setAccount({
      account: account,
      balance,
      isAdmin: admin.toUpperCase() == account.toUpperCase(),
      profile
    });
  },
  setAccount: ({ account, balance, isAdmin, profile }) => state => {
    return {
      ...state,
      account: account,
      balance: balance,
      isAdmin: isAdmin,
      profile
    };
  },

  getParticipants: () => async (state, actions) => {
    let participants = [];
    // TODO: Load all participants from Main contract.
    // One participant should contain { address, fullname, email, nSession and deviation }
    let nParticipant = await contractFunctions.nParticipants();

    // Loop through all participants to get details information of each participant
    if(nParticipant > 0) {
      for(let i = 0; i < nParticipant; i++) {
        
        // Get address of participant
        let address = await contractFunctions.iParticipants(i)();
        let participant =  await contractFunctions.participants(address)();
        participant.address = address;
        participants.push(participant);
      }
    }
    actions.setParticipants(participants);
  },

  setParticipants: participants => state => {
    return {
      ...state,
      participants: participants
    };
  },

  setProfile: profile => state => {
    return {
      ...state,
      profile: profile
    };
  },

  register: () => async (state, actions) => {
    // TODO: Register new participant
    const profile = state.profile;
    let fullname = state.profile.fullname;
    let email = state.profile.email;
    let account = state.account;
    try {
      await contractFunctions.register(fullname, email, account);
      if(profile.isMember) {
        actions.setMessage('Congratulations! Your information updated.');
      } else  {
        actions.setMessage('Congratulations! Your register success.');
      }
      actions.showAlertMessage('success');
    } catch (error) {
      if(profile.isMember) {
        actions.setMessage('Sorry! Update information failed.');
      } else  {
        actions.setMessage('Sorry! Your register failed');
      }
      actions.showAlertMessage('error');
    }
    // TODO: And get back the information of created participant
    actions.setProfile(profile);
    window.location.reload(false); 
  },

  getSessions: () => async (state, actions) => {
    // TODO: Get the number of Sessions stored in Main contract
    let nSession = await contractFunctions.nSessions();
    let sessions = [];

    // TODO: And loop through all sessions to get information

    for (let index = 0; index < nSession; index++) {
      try {
        // Get session address
        let session = await contractFunctions.sessions(index)();
        // Load the session contract on network
        let contract = new web3js.eth.Contract(Session.abi, session);
        
        // Get product information from session contract
        
        let gasAmount = await contract.methods.product().estimateGas({from: state.account});
        let product = await contract.methods.product().call({from: state.account, gas: gasAmount});
      
        let id = session;
        // TODO: Load information of session.
        // Hint: - Call methods of Session contract to reveal all nessesary information
        //       - Use `await` to wait the response of contract
        let name = product.name; // TODO
        let description = product.description; // TODO
        let price = product.price; // TODO
        let image = product.image; // TODO
        let status =  actions.getStatus(Number(product.status));
        sessions.push({ id, name, description, price, contract, image, status });
          
      } catch (error) {
        console.log(error);
      } 
      
    }
    actions.setSessions(sessions);
  },

  setSessions: sessions => state => {
    return {
      ...state,
      sessions: sessions
    };
  },
  getStatus: (number) => {
    let status;
    switch(number) {
      case 0:
        status = 'Created';
        break;
      case 1:
        status = 'Stoped';
        break;
      case 2:
        status = 'Pricing';
        break;
      case 3:
        status = 'Closed';
        break;
    }
    return status;
  },
  setMessage: message => state => {
    return {
      ...state,
      message: message
    }
  },
  showAlertMessage(type, hide) {
    $('#model').hide();
    switch (type) {
      case 'info':
        $('#model').removeClass().addClass('alert alert-info');
        break;
      case 'error':
        $('#model').removeClass().addClass('alert alert-danger');
        break;
      case 'success':
        $('#model').removeClass().addClass('alert alert-success');
        break;
    }
    $('#model').show();
    setTimeout(() => {
      $('#model').hide();
    }, 10000);
  }
};


const view = (
  state,
  { getAccount, getParticipants, register, inputProfile, getSessions }
) => {
  return (
    <body
      class='app sidebar-show sidebar-fixed'
      oncreate={async () => {
        await getAccount();
        await getParticipants();
        await getSessions();
        
      }}
    >
      <div class="alert alert-info" role="alert" id="model">
        {state.message}
        <button type="button" class="close ml-4" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class='app-body'>
        <Sidebar
          balance={state.balance}
          account={state.account}
          isAdmin={state.isAdmin}
          profile={state.profile}
          register={register}
          inputProfile={inputProfile}
        ></Sidebar>
        <main class='main d-flex p-3'>
          <div class='h-100 w-100'>
            <Route path='/products' render={Products}></Route>
            <Route path='/participants' render={Participants}></Route>
          </div>
        </main>
      </div>
    </body>
  );
};
const el = document.body;

const main = app(state, actions, view, el);
const unsubscribe = location.subscribe(main.location);

