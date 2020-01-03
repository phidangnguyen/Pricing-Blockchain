let Main = artifacts.require('./Main.sol');
let mainContract;
let admin;

contract('MainContract', (accounts) => {
    // accounts[0] is set default account deployed
    describe('Main contract deployment', () => {
        it('Main contract deployment', async () => {
            // Fetch the main contract instance
            mainContract = await Main.deployed();
            assert(mainContract !== undefined, 'Main contract should be defined');
        });
        it('Admin account is the account deployed', async () => {
            admin = await mainContract.admin();
            assert(admin === accounts[0], 'Admin have to set by account deployed.');
        });
    });

    // Register functions
    describe('Register functions', () => {
        it('Participant can register/update Fullname and Email', async () => {
            await mainContract.register('Nguyen Van A', 'nguyenvana@gmail.com', {from: accounts[1]});
            let user = await mainContract.participants(accounts[1]);
            assert(user.fullname === 'Nguyen Van A' && user.email === 'nguyenvana@gmail.com', 'User information need to save.')
        });
    });

});