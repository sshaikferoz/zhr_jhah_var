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
				console.log("=== CustomHeader Controller Extension Initialized ===");
				this._applyAdminActionVisibility();

			},
			routing: {
				onAfterBinding: function (oBindingContext) {

					// Re-apply because Fiori Elements may recreate
					// StandardAction::Create buttons after binding
					this._applyUIEnhancements();

				}
			}
		},
		_applyUIEnhancements: function () {

			var oExtension = this;
			var oView = this.base.getView();

			// ---------------------------------------------------------------
			// Config: exact-ID buttons that get a specific replacement label
			// ---------------------------------------------------------------
			var VIEW_ID_PREFIX = "com.jhah.zhrjhahvar::VarListObjectPage--";

			var aCreateButtonConfig = [
				{ id: VIEW_ID_PREFIX + "fe::table::_VehicleDetails::LineItem::StandardAction::Create", text: "Add Vehicle" },
				{ id: VIEW_ID_PREFIX + "fe::table::_VisitorDetails::LineItem::StandardAction::Create", text: "Add Visitor" },
				{ id: VIEW_ID_PREFIX + "fe::table::_ApprovalHist::LineItem::StandardAction::Create", text: "Add Approval" }
			];

			// ---------------------------------------------------------------
			// Config: exact-ID controls to hide (e.g. table personalization
			// / settings "gear" buttons)
			// ---------------------------------------------------------------
			var aHideControlConfig = [
				{ id: VIEW_ID_PREFIX + "fe::table::_VehicleDetails::LineItem-settings" },
				{ id: VIEW_ID_PREFIX + "fe::table::_VisitorDetails::LineItem-settings" },
				{ id: VIEW_ID_PREFIX + "fe::table::_ApprovalHist::LineItem-settings" }
			];

			var FOOTER_SELECTOR =
				".sapMFooter-CTX, .sapFDynamicPageFooter, .sapMPageFooter, footer";

			var DEBOUNCE_MS = 150;
			var MAX_WAIT_RETRIES = 25; // ~5s at 200ms, avoids an infinite retry loop
			var iWaitRetries = 0;

			// ---------------------------------------------------------------
			// Core relabel/hide logic
			// ---------------------------------------------------------------
			function relabelButtons() {

				var $view = oView.$();
				if (!$view || $view.length === 0) {
					return;
				}

				try {

					// 1. Exact evidence-table Create buttons ------------------
					aCreateButtonConfig.forEach(function (oCfg) {

						// Prefer the view's own byId (scoped, not deprecated
						// global lookup) so we don't depend on sap.ui.getCore().
						var oBtn = oView.byId(
							oCfg.id.replace(oView.getId() + "--", "")
						) || sap.ui.getCore().byId(oCfg.id);

						if (!oBtn || typeof oBtn.getText !== "function") {
							return;
						}

						if (String(oBtn.getText() || "").trim().toUpperCase() === "CREATE") {
							oBtn.setText(oCfg.text);
						}
					});

					// 2. Exact controls to hide (settings/personalization) ----
					aHideControlConfig.forEach(function (oCfg) {

						var oCtrl = oView.byId(
							oCfg.id.replace(oView.getId() + "--", "")
						) || sap.ui.getCore().byId(oCfg.id);

						if (!oCtrl || typeof oCtrl.setVisible !== "function") {
							return;
						}

						if (oCtrl.getVisible()) {
							oCtrl.setVisible(false);
						}
					});

					// 3. Footer Create -> Submit -------------------------------
					// Scope the query to footer containers first (cheaper than
					// scanning every .sapMBtn in the view on each mutation).
					$view.find(FOOTER_SELECTOR).find(".sapMBtn").each(function () {

						var oBtn = sap.ui.core.Element.closestTo(this);
						if (!oBtn || typeof oBtn.getText !== "function") {
							return;
						}

						if (
							String(oBtn.getText() || "").trim().toUpperCase() === "CREATE" &&
							oBtn.getText() !== "Submit"
						) {
							oBtn.setText("Submit");
						}
					});

				} catch (e) {
					// eslint-disable-next-line no-console
					console.error("Error while relabeling/hiding controls:", e);
				}
			}

			// Debounce so bursts of DOM mutations only trigger one pass.
			var iDebounceHandle = null;
			function scheduleRelabel() {
				if (iDebounceHandle) {
					clearTimeout(iDebounceHandle);
				}
				iDebounceHandle = setTimeout(relabelButtons, DEBOUNCE_MS);
			}

			// ---------------------------------------------------------------
			// Wait for the view DOM, then run once + attach observer
			// ---------------------------------------------------------------
			function init() {

				var $view = oView.$();

				if (!$view || $view.length === 0) {

					iWaitRetries++;
					if (iWaitRetries > MAX_WAIT_RETRIES) {
						console.warn("View DOM never became ready; giving up.");
						return;
					}

					setTimeout(init, 200);
					return;
				}

				relabelButtons();

				if ($view.data("createToSubmitObserverAttached")) {
					return;
				}

				var domView = $view[0];
				if (!domView) {
					return;
				}

				var oObserver = new MutationObserver(scheduleRelabel);

				oObserver.observe(domView, {
					childList: true,
					subtree: true
				});

				$view.data("createToSubmitObserverAttached", true);
				$view.data("createToSubmitObserver", oObserver);

				// Clean up if the view/controller is destroyed, so the
				// observer doesn't keep firing on a detached DOM tree.
				if (typeof oView.attachEventOnce === "function") {
					oView.attachEventOnce("_getControllerExtensionAfterExit" /* or 'exit' if you wire it elsewhere */, function () {
						oObserver.disconnect();
					});
				}
			}

			init();
		},
		// _applyUIEnhancements: function () {

		// 	var oExtension = this;
		// 	var oView = this.base.getView();

		// 	// ---------------------------------------------------------------
		// 	// Config: exact-ID buttons that get a specific replacement label
		// 	// ---------------------------------------------------------------
		// 	var VIEW_ID_PREFIX = "com.jhah.zhrjhahvar::VarListObjectPage--";

		// 	var aCreateButtonConfig = [
		// 		{ id: VIEW_ID_PREFIX + "fe::table::_VehicleDetails::LineItem::StandardAction::Create", text: "Add Vehicle" },
		// 		{ id: VIEW_ID_PREFIX + "fe::table::_VisitorDetails::LineItem::StandardAction::Create", text: "Add Visitor" },
		// 		{ id: VIEW_ID_PREFIX + "fe::table::_ApprovalHist::LineItem::StandardAction::Create", text: "Add Approval" }
		// 	];

		// 	var FOOTER_SELECTOR =
		// 		".sapMFooter-CTX, .sapFDynamicPageFooter, .sapMPageFooter, footer";

		// 	var DEBOUNCE_MS = 150;
		// 	var MAX_WAIT_RETRIES = 25; // ~5s at 200ms, avoids an infinite retry loop
		// 	var iWaitRetries = 0;

		// 	// ---------------------------------------------------------------
		// 	// Core relabel logic
		// 	// ---------------------------------------------------------------
		// 	function relabelButtons() {

		// 		var $view = oView.$();
		// 		if (!$view || $view.length === 0) {
		// 			return;
		// 		}

		// 		try {

		// 			// 1. Exact evidence-table Create buttons ------------------
		// 			aCreateButtonConfig.forEach(function (oCfg) {

		// 				// Prefer the view's own byId (scoped, not deprecated
		// 				// global lookup) so we don't depend on sap.ui.getCore().
		// 				var oBtn = oView.byId(
		// 					oCfg.id.replace(oView.getId() + "--", "")
		// 				) || sap.ui.getCore().byId(oCfg.id);

		// 				if (!oBtn || typeof oBtn.getText !== "function") {
		// 					return;
		// 				}

		// 				if (String(oBtn.getText() || "").trim().toUpperCase() === "CREATE") {
		// 					oBtn.setText(oCfg.text);
		// 				}
		// 			});

		// 			// 2. Footer Create -> Submit -------------------------------
		// 			// Scope the query to footer containers first (cheaper than
		// 			// scanning every .sapMBtn in the view on each mutation).
		// 			$view.find(FOOTER_SELECTOR).find(".sapMBtn").each(function () {

		// 				var oBtn = sap.ui.core.Element.closestTo(this);
		// 				if (!oBtn || typeof oBtn.getText !== "function") {
		// 					return;
		// 				}

		// 				if (
		// 					String(oBtn.getText() || "").trim().toUpperCase() === "CREATE" &&
		// 					oBtn.getText() !== "Submit"
		// 				) {
		// 					oBtn.setText("Submit");
		// 				}
		// 			});

		// 		} catch (e) {
		// 			// eslint-disable-next-line no-console
		// 			console.error("Error while relabeling buttons:", e);
		// 		}
		// 	}

		// 	// Debounce so bursts of DOM mutations only trigger one pass.
		// 	var iDebounceHandle = null;
		// 	function scheduleRelabel() {
		// 		if (iDebounceHandle) {
		// 			clearTimeout(iDebounceHandle);
		// 		}
		// 		iDebounceHandle = setTimeout(relabelButtons, DEBOUNCE_MS);
		// 	}

		// 	// ---------------------------------------------------------------
		// 	// Wait for the view DOM, then run once + attach observer
		// 	// ---------------------------------------------------------------
		// 	function init() {

		// 		var $view = oView.$();

		// 		if (!$view || $view.length === 0) {

		// 			iWaitRetries++;
		// 			if (iWaitRetries > MAX_WAIT_RETRIES) {
		// 				console.warn("View DOM never became ready; giving up.");
		// 				return;
		// 			}

		// 			setTimeout(init, 200);
		// 			return;
		// 		}

		// 		relabelButtons();

		// 		if ($view.data("createToSubmitObserverAttached")) {
		// 			return;
		// 		}

		// 		var domView = $view[0];
		// 		if (!domView) {
		// 			return;
		// 		}

		// 		var oObserver = new MutationObserver(scheduleRelabel);

		// 		oObserver.observe(domView, {
		// 			childList: true,
		// 			subtree: true
		// 		});

		// 		$view.data("createToSubmitObserverAttached", true);
		// 		$view.data("createToSubmitObserver", oObserver);

		// 		// Clean up if the view/controller is destroyed, so the
		// 		// observer doesn't keep firing on a detached DOM tree.
		// 		if (typeof oView.attachEventOnce === "function") {
		// 			oView.attachEventOnce("_getControllerExtensionAfterExit" /* or 'exit' if you wire it elsewhere */, function () {
		// 				oObserver.disconnect();
		// 			});
		// 		}
		// 	}

		// 	init();
		// },

		
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