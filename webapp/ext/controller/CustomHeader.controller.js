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

				// var oView = this.base.getView();

				// this._myDelegate = {
				// 	"onAfterRendering": function () {
				// 		this._loadDataAndFragment();
				// 	}
				// };
				// oView.addEventDelegate(this._myDelegate, this);

				// Hide the admin-only toolbar actions (Copy Request / Maintain
				// Locations) by default; reveal them only once the admin check
				// confirms the logged-in user is an admin.
				this._applyAdminActionVisibility();
			}
		},

		/**
		 * Toggle visibility of the admin-only toolbar actions ("Copy Request"
		 * and "Maintain Locations") based on the logged-in user's admin flag.
		 * The flag lives on the EmployeeHeader entity (Admin = "X" for admins)
		 * of the main service. Admins get the actions; everyone else does not.
		 *
		 * Same approach as the Sticker app: the actions are hidden by default
		 * via body.hideAdminActions (css/style.css) and revealed only when the
		 * check resolves to an admin. On a failed or pending check they stay
		 * hidden, so non-admins never see them flash in (safe default).
		 */
		_applyAdminActionVisibility: function () {
			// Hidden until the role is known.
			document.body.classList.add("hideAdminActions");

			// During onInit the view isn't connected to the component tree yet,
			// so read the OData model from the app component, which owns it, and
			// fall back to the view.
			var oView = this.base.getView();
			var oComponent = (typeof this.base.getAppComponent === "function") ? this.base.getAppComponent() : null;
			var oModel = (oComponent && oComponent.getModel()) || (oView && oView.getModel());
			if (!oModel) {
				console.error("OData model not available for admin check.");
				return;
			}

			try {
				var oListBinding = oModel.bindList("/EmployeeHeader", null, null, null, { $$groupId: "$direct" });
				oListBinding.requestContexts(0, 1).then(function (aContexts) {
					var bIsAdmin = false;
					if (aContexts && aContexts.length > 0) {
						var oUserData = aContexts[0].getObject();
						bIsAdmin = oUserData && oUserData.Admin === "X";
					}
					if (bIsAdmin) {
						document.body.classList.remove("hideAdminActions");
					} else {
						document.body.classList.add("hideAdminActions");
					}
				}).catch(function (err) {
					console.error("Admin check fetch failed:", err);
					// Keep the actions hidden on failure (safe default).
				});
			} catch (err) {
				console.error("Error running admin check:", err);
			}
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