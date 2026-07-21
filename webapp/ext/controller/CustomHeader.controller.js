sap.ui.define([
	'sap/ui/core/mvc/ControllerExtension',
	'sap/ui/core/Fragment',
	'sap/ui/model/json/JSONModel'
], function (ControllerExtension, Fragment, JSONModel) {
	'use strict';

	return ControllerExtension.extend('com.jhah.zhrjhahvar.ext.controller.CustomHeader', {
		override: {
			onInit: function () {
				// this._setShellTitle();

				this._loadUserInfo();

				// var oView = this.base.getView();

				// this._myDelegate = {
				// 	"onAfterRendering": function () {
				// 		this._loadDataAndFragment();
				// 	}
				// };
				// oView.addEventDelegate(this._myDelegate, this);
			}
		},

		/**
		 * Loads the logged-in user's EmployeeHeader record and exposes it as a
		 * component-level "userInfo" JSON model. This drives admin-only visibility
		 * of the "Copy Request" and "Maintain Locations" toolbar actions, bound in
		 * manifest.json as {= ${userInfo>/Admin} === 'X'}.
		 *
		 * The model is created empty up-front so the visibility bindings resolve
		 * immediately (default: not admin -> hidden), then updated once the record
		 * arrives, at which point the bindings re-evaluate reactively.
		 */
		_loadUserInfo: function () {
			var oAppComponent = this.base.getAppComponent();

			var oUserInfo = new JSONModel({ Admin: "" });
			oAppComponent.setModel(oUserInfo, "userInfo");

			var oODataModel = oAppComponent.getModel();
			if (!oODataModel) return;

			var oListBinding = oODataModel.bindList("/EmployeeHeader");
			oListBinding.requestContexts(0, 1).then(function (aContexts) {
				if (aContexts && aContexts.length > 0) {
					oUserInfo.setData(aContexts[0].getObject());
				}
			}).catch(function () {
				// On failure, leave the default (non-admin) so the actions stay hidden.
			});
		},

		/**
		 * Pushes the app title from i18n into the FLP shell bar.
		 * Required because Fiori Elements overrides the shell title
		 * with "List Report" unless ShellUIService.setTitle is disabled
		 * in the manifest and the title is set manually here.
		 */
		_setShellTitle: function () {
			var oAppComponent = this.base.getAppComponent();
			var sTitle = oAppComponent
				.getModel("i18n")
				.getResourceBundle()
				.getText("appTitle");

			oAppComponent.getService("ShellUIService")
				.then(function (oShellUIService) {
					oShellUIService.setTitle(sTitle);
				})
				.catch(function () {
					// Standalone mode (index.html) — no FLP shell present, safe to ignore.
				});
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