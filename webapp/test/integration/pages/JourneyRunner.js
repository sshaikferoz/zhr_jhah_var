sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"com/jhah/zhrjhahvar/test/integration/pages/VarListList",
	"com/jhah/zhrjhahvar/test/integration/pages/VarListObjectPage"
], function (JourneyRunner, VarListList, VarListObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('com/jhah/zhrjhahvar') + '/test/flp.html#app-preview',
        pages: {
			onTheVarListList: VarListList,
			onTheVarListObjectPage: VarListObjectPage
        },
        async: true
    });

    return runner;
});

