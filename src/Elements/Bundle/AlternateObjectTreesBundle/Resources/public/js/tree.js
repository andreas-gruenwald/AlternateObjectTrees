pimcore.registerNS("pimcore.plugin.alternateObjectTrees.tree");
pimcore.plugin.alternateObjectTrees.tree = Class.create(pimcore.object.tree, {

    treeDataUrl: "/admin/elements-alternate-object-trees/admin/tree-get-children-by-id",

    initialize: function(config) {

        // ...
        this.position = "right";

        this.config = {
            rootId: 1,
            rootVisible: true,
            allowedClasses: "all",
            alternateTreeId: config.id,
            // loaderBaseParams: {
            //     alternateTreeId: config.id
            // },
            treeId: "pimcore_panel_tree_alternate_object_tree_" + config.id,
            treeIconCls: "pimcore_panel_tree_objects_alternate_tree",
            treeTitle: config.name, //t('pimcore_panel_tree_objects_alternate_tree'),
            parentPanel: Ext.getCmp("pimcore_panel_tree_left"),
            index: 4
        };

        // create temporary css icon
        if(config.icon)
        {
            this.config.treeIcon = config.icon;
            this.config.treeIconCls = 'pimcore_panel_tree_objects_alternate_tree_custom_' + config.id;
            Ext.util.CSS.createStyleSheet(
                '.' + this.config.treeIconCls + ' {background: url(' + config.icon + ') left center no-repeat !important;}'
            );
        }

        // update label
        if(config.label)
            this.config.treeTitle = config.label;


        pimcore.layout.treepanelmanager.register(this.config.treeId);

        var rootNode = {
            id: config.id,
            text: "",
            type: "folder",
            level: 0,
            attributeValue: null,
            isConfigNode: true,
            permissions: {}
//            "elementType":"object",
//            "isTarget":false,
//            "allowDrop":false,
//            "allowChildren":false,
//            "leaf":false,
//            "iconCls":"folder_database", // pimcore_icon_folder
//            "expanded":false,
//            "permissions":{}
        };

        this.perspectiveCfg = new pimcore.perspective({
            position: "left"
        });

        this.init(rootNode);
    },

    init: function(rootNodeConfig) {

        rootNodeConfig.nodeType = "async";
        rootNodeConfig.text = t("home");
        rootNodeConfig.allowDrag = true;
        rootNodeConfig.iconCls = "pimcore_icon_home";

        var store = Ext.create('pimcore.data.PagingTreeStore', {
            autoLoad: false,
            autoSync: false,
            proxy: {
                type: 'ajax',
                url: this.treeDataUrl,
                reader: {
                    type: 'json',
                    totalProperty: 'total',
                    rootProperty: 'nodes'
                }
            },
            listeners: {
                beforeload: function(store, operation) {
                    var baseParams = operation.getConfig('params');
                    var node = operation.node;

                    baseParams.alternateTreeId = this.config.alternateTreeId;
                    baseParams.level = node.data.level;
                    baseParams.attributeValue = node.data.attributeValue;
                    baseParams.isConfigNode = node.data.isConfigNode;
                    if(node.data.filterValues) {
                        baseParams.filterValues = Ext.encode(node.data.filterValues);
                    }
                    // loader.baseParams = baseParams;

                }.bind(this)
            },
            pageSize: 30,
            root: rootNodeConfig
        });

        this.tree = new Ext.tree.TreePanel({
            store: store,
            region: "center",
            useArrows:true,
            id: this.config.treeId,
            title: this.config.treeTitle,
            iconCls: this.config.treeIconCls,
            scrollable: true,
            // animate:true,
            // enableDD:true,
            // ddAppendOnly: true,
            // ddGroup: "element",
            // containerScroll: true,
            rootVisible: this.config.rootVisible,
            root: rootNodeConfig,
            border: false,
            tools: [{
                type: "right",
                handler: pimcore.layout.treepanelmanager.toRight.bind(this)
            },{
                type: "left",
                handler: pimcore.layout.treepanelmanager.toLeft.bind(this),
                hidden: true
            }],
            viewConfig: {
                xtype: 'pimcoretreeview',
                plugins: {
                    ptype: 'treeviewdragdrop',
                    appendOnly: true,
                    ddGroup: 'element',
                    scrollable: true
                },
                listeners: {
                    nodedragover: this.onTreeNodeOver.bind(this)
                }
            },
            listeners: this.getTreeNodeListeners()
            // loader: new Ext.ux.tree.PagingTreeLoader({
            //     dataUrl:this.treeDataUrl,
            //     pageSize:30,
            //     enableTextPaging:false,
            //     pagingModel:'remote',
            //     requestMethod: "GET",
            //     baseAttrs: {
            //         listeners: this.getTreeNodeListeners(),
            //         reference: this,
            //         nodeType: "async"
            //     },
            //     listeners: {
            //         beforeload: function( loader, node, callback ) {
            //             var baseParams = loader.baseParams;
            //
            //             baseParams.level = node.attributes.level;
            //             baseParams.attributeValue = node.attributes.attributeValue;
            //             baseParams.isConfigNode = node.attributes.isConfigNode;
            //             baseParams.filterValues = Ext.encode(node.attributes.filterValues);
            //             loader.baseParams = baseParams;
            //
            //         }
            //     },
            //     baseParams: this.config.loaderBaseParams
            // })
        });

        store.on('nodebeforeexpand', function(node) {
            pimcore.helpers.addTreeNodeLoadingIndicator('object', node.data.id);
        });

        store.on("nodeexpand", function (node, index, item, eOpts) {
            pimcore.helpers.removeTreeNodeLoadingIndicator("object", node.data.id);
        });

        this.tree.on("render", function () {
            this.getRootNode().expand();
        });

        // this.tree.on("startdrag", this.onDragStart.bind(this));
        // this.tree.on("enddrag", this.onDragEnd.bind(this));

        this.tree.on("afterrender", function () {
            this.tree.loadMask = new Ext.LoadMask({
                target: Ext.getCmp(this.config.treeId),
                msg: t("please_wait")
            });

            //this.tree.loadMask.enable();
        }.bind(this));

        this.config.parentPanel.insert(this.config.index, this.tree);
        this.config.parentPanel.updateLayout();
    }
});

