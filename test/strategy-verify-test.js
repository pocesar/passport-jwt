var chai = require('chai')
    , Strategy = require('../lib/strategy')
    , test_data = require('./testdata')
    , sinon = require('sinon')
    , extract_jwt = require('../lib/extract_jwt');


describe('Strategy', function() {

    before(function() {
        Strategy.JwtVerifier = sinon.stub(); 
        Strategy.JwtVerifier.callsArgWith(3, null, test_data.valid_jwt.payload);
    });

    describe('Handling a request with a valid JWT and succesful verification', function() {

        var strategy, user, info; 

        before(function(done) {
            strategy = new Strategy({jwtFromRequest:extract_jwt.fromAuthHeaderAsBearerToken(), secretOrKey: 'secret'}, function(jwt_paylod, next) {
                return next(null, {user_id: 1234567890}, {foo:'bar'});
            });

            chai.passport.use(strategy)
                .success(function(u, i) {
                    user = u;
                    info = i;
                    done();
                })
                .req(function(req) {
                    req.headers['authorization'] = "bearer " + test_data.valid_jwt.token;
                })
                .authenticate();
        });


        it('should provide a user', function() {
            expect(user).to.be.an.object;
            expect(user.user_id).to.equal(1234567890);
        });


        it('should forward info', function() {
            expect(info).to.be.an.object;
            expect(info.foo).to.equal('bar');
        });

    });



    describe('handling a request with valid jwt and failed verification', function() {

        var strategy, info;

        before(function(done) {
            strategy = new Strategy({jwtFromRequest: extract_jwt.fromAuthHeaderAsBearerToken(), secretOrKey: 'secret'}, function(jwt_payload, next) {
                return next(null, false, {message: 'invalid user'});
            });

            chai.passport.use(strategy)
                .fail(function(i) {
                    info = i;
                    done();
                })
                .req(function(req) { 
                    req.headers['authorization'] = "bearer " + test_data.valid_jwt.token;
                })
                .authenticate();
        });


        it('should fail with info', function() {
            expect(info).to.be.an.object;
            expect(info.message).to.equal('invalid user');
        });
        
    });



    describe('handling a request with a valid jwt and an error during verification', function() {

        var strategy, err;

        before(function(done) {
            strategy = new Strategy({jwtFromRequest: extract_jwt.fromAuthHeaderAsBearerToken(), secretOrKey: 'secrety'}, function(jwt_payload, next) {
                return next(new Error("ERROR"), false, {message: 'invalid user'});
            });

            chai.passport.use(strategy)
                .error(function(e) {
                    err = e;
                    done();
                })
                .req(function(req) { 
                    req.headers['authorization'] = "bearer " + test_data.valid_jwt.token;
                })
                .authenticate();
        });


        it('should error', function() {
            expect(err).to.be.an.instanceof(Error);
            expect(err.message).to.equal('ERROR');
        });

    });



    describe('handling a request with a valid jwt and an exception during verification', function() {
        var strategy, err;

        before(function(done) {
            strategy = new Strategy({jwtFromRequest: extract_jwt.fromAuthHeaderAsBearerToken(), secretOrKey: 'secret'}, function(jwt_payload, next) {
                throw new Error("EXCEPTION");
            });

            chai.passport.use(strategy)
                .error(function(e) {
                    err = e;
                    done();
                })
                .req(function(req) { 
                    req.headers['authorization'] = "bearer " + test_data.valid_jwt.token;
                })
                .authenticate();
        });


        it('should error', function() {
            expect(err).to.be.an.instanceof(Error);
            expect(err.message).to.equal('EXCEPTION');
        });

    });



    describe('handling a request with a valid jwt and option passReqToCallback is true', function() {

        var strategy, expected_request, request_arg;

        before(function(done) {
            opts = { passReqToCallback: true };
            opts.secretOrKey = 'secret';
            opts.jwtFromRequest = extract_jwt.fromAuthHeaderAsBearerToken();
            strategy = new Strategy(opts, function(request, jwt_payload, next) {
                // Capture the value passed in as the request argument
                request_arg = request;
                return next(null, {user_id: 1234567890}, {foo:'bar'});
            });

            chai.passport.use(strategy)
                .success(function(u, i) {
                    done();
                })
                .req(function(req) {
                    req.headers['authorization'] = "bearer " + test_data.valid_jwt.token;
                    expected_request = req;
                })
                .authenticate();
        });

        it('will call verify with request as the first argument', function() {
            expect(expected_request).to.equal(request_arg);
        });

    });

});
