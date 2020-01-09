let Main = artifacts.require('./Main.sol');
let Session = artifacts.require('./Session.sol')
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
            admin = await mainContract.getAdmin();
            console.log(admin);
            console.log(accounts[0]);
            assert(admin === accounts[0], 'Admin have to set by account deployed.');
        });
    });

    // Register functions
    describe('Register functions and get details infomations', () => {
        it('Participant can register/update Fullname and Email', async () => {
            await mainContract.register('Nguyen Van A', 'nguyenvana@gmail.com', {from: accounts[1]});
            let user = await mainContract.participants(accounts[1]);
            assert(user.fullname === 'Nguyen Van A' && user.email === 'nguyenvana@gmail.com', 'User information need to save.')
        });

        it('Admin load list all participant account', async () => {
            // Participant register
            await mainContract.register('Nguyen Van B', 'nguyenvanb@gmail.com', {from: accounts[2]});
            await mainContract.register('Nguyen Van C', 'nguyenvanc@gmail.com', {from: accounts[3]});
            await mainContract.register('Nguyen Van D', 'nguyenvand@gmail.com', {from: accounts[4]});
            const nPartic = await mainContract.getNParti({from: admin, gas: 300000});
            const accountPatic2 = await mainContract.getIParti(1, {from: admin, gas: 300000});
            const accountPatic3 = await mainContract.getIParti(2, {from: admin, gas: 300000});
            const accountPatic4 = await mainContract.getIParti(3, {from: admin, gas: 300000});

            assert(Number(nPartic) == 4, 'Load number participant failed');
            assert(accountPatic2 == accounts[2], 'Load account failed');
            assert(accountPatic3 == accounts[3], 'Load account failed');
            assert(accountPatic4 == accounts[4], 'Load account failed');

            // Can not Fetch number participant with account non-admin
            try {
                const nPartic = await mainContract.getNParti({from: accounts[2], gas: 300000});
                assert(false, 'Not fetch number of all participant with account non-admin');
            } catch (error) {
                assert(true);
            }
        });
    });

    describe('Only admin can create new pricing session', () => {
        let sessionContract;
        it('Admin create new pricing session', async () => {
            // Create new pricing session;
            const name = 'Laptop Dell';
            const description = 'Dell 2019';
            const image = '123456789123456789'
            sessionContract = await Session.new(mainContract.address, name, description, image, {from: admin});
            assert(sessionContract !== undefined, 'Session contract should be defined');
        });
        it('Participant can not create new product', async () => {
            const name = 'Laptop Dell';
            const description = 'Dell 2019';
            const image = '123456789123456789';
            try {
                let session = await Session.new(mainContract.address, name, description, image, {from: accounts[1]});
                assert(fasle, 'Participant can not create product');
            } catch (error) {
                assert(true);
            }
        });
    });

    describe('Lifecycle of pricing session', async() => {
        let sessionContract;
        let status;

        // Participant can not start session
        it('Participant can not start session', async() => {
            const name = 'Laptop Dell';
            const description = 'Dell 2019';
            const image = '123456789123456789';
            sessionContract = await Session.new(mainContract.address, name, description, image, {from: admin});
            try {
                await sessionContract.startSession(0, {from: accounts[1]});
                assert(false,'Participant can not start session.');
            } catch (error) {
                assert(true);
            }
        });

        // Admin start session product
        it('Admin start session product', async() => {
            try {
                await sessionContract.startSession(0, {from: admin});
                let product = await sessionContract.product({from: admin});
                status = product.status.toString();
                assert(status == '2','Start sesion failed.');
            } catch (error) {
                console.log(error);
                assert(false, 'Admin can start session failed');
            }
        });

        // Can not start sesion when status not is Created
        it('Can not start sesion when status not is Created', async () => {
            // Now status is Pricing == 2
            try {
                await sessionContract.startSession(0, {from: admin});
                assert(false,'Can not start sesion when status not is Created');
            } catch (error) {
                assert(true);
            }
        });

        // Participant pricing product
        it('Participant pricing product sussess', async () => {
            try {
                await sessionContract.pricing(100, {from: accounts[2]});
                await sessionContract.pricing(50, {from: accounts[3]});
                await sessionContract.pricing(200, {from: accounts[4]});
                assert(true);
            } catch (error) { 
                console.log(error);
                assert(false);
            }
        });

        // Only admin can stop session 
        it('Admin stop pricing session', async () => {
            try {
                await sessionContract.stopSession({from: admin});
                let product = await sessionContract.product({from: admin});
                status = product.status.toString();
                // Status stoped is '1'
                assert(status == '1', 'Stop pricing session failed.');
            } catch (error) {
                console.log(error);
                assert(false);
            }
        });

        // Participant cannot stop session
        it('Participants can not stop session', async () => {
            try {
                await sessionContract.stopSession({from: accounts[2]});
                assert(false, 'Participant can not stop session');
            } catch (error) {
                assert(true);
            }
        });

        // Cannot stop session when status of session is non-pricing
        it('Cannot stop session when status of session is non-pricing', async () => {
            // Now, status is stoped.
            try {
                await sessionContract.stopSession({from: admin});
                assert(false, 'Participant can not stop session');
            } catch (error) {
                assert(true);
            }
        });

        // Participant cannot pricing when status of session is non-pricing
        it('Participant cannot pricing when status of session is non-pricing', async () => {
            try {
                await sessionContract.pricing(100, {from: accounts[2]});
                assert(false, 'Participant cannot pricing when status of session is non-pricing');
            } catch (error) {
                assert(true);
            }
        });

        // Only admin can close session 
        it('Admin close pricing session', async () => {
            try {
                await sessionContract.closeSession({from: admin});
                let product = await sessionContract.product({from: admin});
                status = product.status.toString();
                // Status closed is '3'
                assert(status == '3', 'Close pricing session failed.');
            } catch (error) {
                console.log(error);
                assert(false);
            }
        });

        // Participant cannot Close session
        it('Participants can not Close session', async () => {
            try {
                await sessionContract.closeSession({from: accounts[2]});
                assert(false, 'Participant can not close session');
            } catch (error) {
                assert(true);
            }
        });

        // Cannot close session when status of session is non-stoped
        it('Cannot close session when status of session is non-stoped', async () => {
            // Now, status is closed.
            try {
                await sessionContract.closeSession({from: admin});
                assert(false, 'Participant can not close session');
            } catch (error) {
                assert(true);
            }
        });

        // When session stop, the final price will have auto calculate.
        it('When session stop, the final price will have auto calculate', async () => {
            try {
                let product = await sessionContract.product({from: admin});
                let price = Number(product.price);
                assert(price && price != 0, 'Final price not calculate.')
            } catch (error) {
                console.log(error);
            }
        });

        // When session stop, the information of participants have join pricing session will re-calculate

        it('When session stop, the information of participants have join pricing session will re-calculate', async () => {
            try {
                let partic1 = await mainContract.participants(accounts[2], {from: admin});
                let nSessionP1 = Number(partic1.nSessions);
                let deviationP1 = Number(partic1.deviation);
                assert(nSessionP1 != 0 && deviationP1 != 0, 'Participant information not re-calculate.');

                let partic2 = await mainContract.participants(accounts[3], {from: admin});
                let nSessionP2 = Number(partic2.nSessions);
                let deviationP2 = Number(partic2.deviation);
                assert(nSessionP2 != 0 && deviationP2 != 0, 'Participant information not re-calculate.');
            } catch (error) {
                console.log(error);
            }
        });
    });
});