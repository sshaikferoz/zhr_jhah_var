sap.ui.define([
	'sap/ui/core/mvc/ControllerExtension',
	'sap/ui/core/Fragment',
	'sap/ui/model/json/JSONModel'
], function (ControllerExtension, Fragment, JSONModel) {
	'use strict';

	return ControllerExtension.extend('com.jhah.zhrjhahvar.ext.controller.CustomHeader', {
		override: {
			onInit: function () {
				// var oView = this.base.getView();
				
				// this._myDelegate = {
				// 	"onAfterRendering": function () {
				// 		this._loadDataAndFragment();
				// 	}
				// };
				// oView.addEventDelegate(this._myDelegate, this);
			}
		},

		_loadDataAndFragment: function () {
			var oView = this.base.getView();
			var oModel = oView.getModel();

			if (!oModel) return;
			oView.detachModelContextChange(this._loadDataAndFragment, this);

			// Fetch OData
			var oListBinding = oModel.bindList("/EmployeeHeader");
			oListBinding.requestContexts(0, 1).then(function (aContexts) {
				if (aContexts && aContexts.length > 0) {
					var oData = aContexts[0].getObject();
					oView.setModel(new JSONModel(oData), "userInfo");

					// Load the Fragment
					this._injectFragment();
				}
			}.bind(this));
		},

		_injectFragment: function () {
			var oView = this.base.getView();
			var oPage = oView.getContent()[0];
			var oHeader = oPage.getHeader();

			if (oView.byId("myCustomHeaderContainer")) return;

			Fragment.load({
				id: oView.getId(),
				name: "com.jhah.zhrjhahvar.ext.fragment.HeaderProfile",
				controller: this
			}).then(function (oCustomHeader) {
				oHeader.insertContent(oCustomHeader, 0);
			});
		}
	});
});