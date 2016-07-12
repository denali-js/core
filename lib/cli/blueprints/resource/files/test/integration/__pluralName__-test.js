describe('<%= pluralHumanizedName %>', function() {

  setupApp();

  describe('create', function() {
    it('should create a <%= name %>', function() {
      return this.app.post('/<%= pluralName %>', {
          // Add the <%= name %> payload here
        }).then(({ status, body }) => {
          expect(status).to.equal(201);
        });
    });
  });

  describe('list', function() {
    it('should list <%= pluralHumanizedName %>', function() {
      return this.app.get('/<%= pluralName %>')
        .then(({ status, body }) => {
          expect(status).to.equal(200);
        });
    });
  });

  describe('show', function() {
    before(function() {
      return this.app.post('/<%= pluralName %>', {
          // Add the <%= name %> payload here
        }).then(({ body }) => {
          this.id = body.data.id;
        });
    });
    it('should show a <%= name %>', function() {
      return this.app.get(`/<%= pluralName %>/${ this.id }`)
        .then(({ status, body }) => {
          expect(status).to.equal(200);
        });
    });
  });

  describe('update', function() {
    before(function() {
      return this.app.post('/<%= pluralName %>', {
          // Add the <%= name %> payload here
        }).then(({ body }) => {
          this.id = body.data.id;
        });
    });
    it('should update a <%= name %>', function() {
      return this.app.post(`/<%= pluralName %>/${ this.id }`, {
          // Add the <%= name %> payload here
        }).then(({ status, body }) => {
          expect(status).to.equal(200);
        });
    });
  });

  describe('delete', function() {
    before(function() {
      return this.app.post('/<%= pluralName %>', {
          // Add the <%= name %> payload here
        }).then(({ body }) => {
          this.id = body.data.id;
        });
    });
    it('should delete a <%= name %>', function() {
      return this.app.delete(`/<%= pluralName %>/${ this.id }`)
        .then(({ status, body }) => {
          expect(status).to.equal(204);
        });
    });
  });

});
