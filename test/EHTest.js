TestCase("EHBindTest", {
    setUp: function()
    {
        this.oStub = sinon.stub();
        this.oStub2 = sinon.stub();
        EH.unbind(document, "click");
        EH.unbind(document, "test");
    },
    "test should bind one event on click one bind": function()
    {
        EH.bind(document, "click", this.oStub);

        EH.trigger(document, "click");

        assertEquals(1, this.oStub.callCount);
    },
    "test should bind one event on click two binds": function()
    {
        EH.bind(document, "click", this.oStub);
        EH.bind(document, "click", this.oStub);

        EH.trigger(document, "click");

        assertEquals(2, this.oStub.callCount);
    },
    "test should not call any event if we bind 'click' but trigger 'blur'": function()
    {
        EH.bind(document, "click", this.oStub);

        EH.trigger(document, "blur");

        assertEquals(0, this.oStub.callCount);
    },
    "test should bind one event on 'test' - custom event - one bind": function()
    {
        EH.bind(document, "test", this.oStub);

        EH.trigger(document, "test");

        assertEquals(1, this.oStub.callCount);
    },
    "test should bind one event on click two binds": function()
    {
        EH.bind(document, "test", this.oStub);
        EH.bind(document, "test", this.oStub);

        EH.trigger(document, "test");

        assertEquals(2, this.oStub.callCount);
    },
    "test should bind one event on click two binds: different callbacks": function()
    {
        EH.bind(document, "test", this.oStub);
        EH.bind(document, "test", this.oStub2);

        EH.trigger(document, "test");

        assertEquals(1, this.oStub.callCount);
        assertEquals(1, this.oStub2.callCount);
    },
    tearDown: function()
    {
        this.oStub = null;
        this.oStub2 = null;
    }
});

TestCase("EHUnbindTest", {
    setUp: function()
    {
        this.oStub = sinon.stub();
        this.oStub2 = sinon.stub();
        EH.unbind(document, "click");
        EH.unbind(document, "test");
    },
    "test should not call if before trigger we unbind - click -": function()
    {
        EH.bind(document, "click", this.oStub);
        EH.bind(document, "click", this.oStub);

        EH.unbind(document, "click");

        EH.trigger(document, "click");

        assertEquals(0, this.oStub.callCount);
    },
    tearDown: function()
    {
        this.oStub = null;
        this.oStub2 = null;
    }
});