sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"com/jhah/zhrjhahvar/test/integration/pages/VarListList",
	"com/jhah/zhrjhahvar/test/integration/pages/VarListObjectPage",
	"com/jhah/zhrjhahvar/test/integration/pages/VisitorDetailsObjectPage"
], function (JourneyRunner, VarListList, VarListObjectPage, VisitorDetailsObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('com/jhah/zhrjhahvar') + '/test/flp.html#app-preview',
        pages: {
			onTheVarListList: VarListList,
			onTheVarListObjectPage: VarListObjectPage,
			onTheVisitorDetailsObjectPage: VisitorDetailsObjectPage
        },
        async: true
    });

    return runner;
});

