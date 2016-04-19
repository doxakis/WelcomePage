function DashboardViewModel(title, widgets) {
    this.title = ko.observable(title);
    this.widgets = ko.observableArray(widgets);
}

function WidgetViewModel(id, x, y, width, height, title, link, auto_position) {
    this.id = ko.observable(id);
    this.x = ko.observable(x);
    this.y = ko.observable(y);
    this.width = ko.observable(width);
    this.height = ko.observable(height);
    this.title = ko.observable(title);
    this.link = ko.observable(link);
    this.auto_position = ko.observable(auto_position);
}
var vm;

ko.components.register('dashboard-grid', {
    viewModel: {
        createViewModel: function (controller, componentInfo) {
            var ViewModel = function (controller, componentInfo) {
                var grid = null;
                var self = this;
                
                this.widgets = controller.widgets;
                
                this.afterAddWidget = function (items) {
                    if (grid == null) {
                        grid = $(componentInfo.element).find('.grid-stack').gridstack({
                            auto: false,
                            resizable: {
                                handles: 'se, sw'
                            }
                        }).data('gridstack');
                        $('.grid-stack').on('change', function(event, items) {
                            if (items) {
                                var widgets = vm.currentDashboard().widgets();
                                for (var i = 0; i < items.length; i++) {
                                    for (var j = 0; j < widgets.length; j++) {
                                        if (items[i].el.data('id') == widgets[j].id()) {
                                            widgets[j].x(items[i].x);
                                            widgets[j].y(items[i].y);
                                            widgets[j].width(items[i].width);
                                            widgets[j].height(items[i].height);
                                        }
                                    }
                                }
                            }
                            vm.save();
                        });
                    }

                    var item = _.find(items, function (i) { return i.nodeType == 1 });
                    grid.addWidget(item);
                    ko.utils.domNodeDisposal.addDisposeCallback(item, function () {
                        grid.removeWidget(item);
                    });
                };
            };

            return new ViewModel(controller, componentInfo);
        }
    },
    template:
        [
            '<div class="grid-stack" data-bind="foreach: {data: widgets, afterRender: afterAddWidget}">',
            '    <div class="grid-stack-item" data-gs-min-width="2" data-gs-min-height="2" data-bind="attr: {\'data-id\': $data.id, \'data-gs-x\': $data.x, \'data-gs-y\': $data.y, \'data-gs-width\': $data.width, \'data-gs-height\': $data.height, \'data-gs-auto-position\': $data.auto_position}">',
            '        <div class="grid-stack-item-content">',
            '            <div class="bg-primary" style="padding:5px;">',
            '                <span class="text-left" data-bind="text: title, click: $root.editTitle"></span>',
            '                <span class="pull-right">',
            '                    <button class="btn btn-xs btn-success" data-bind="click: $root.openUrl"><span style="color:#fff;" class="glyphicon glyphicon-fullscreen"></span></button>',
            '                    <button class="btn btn-xs btn-warning" data-bind="click: $root.editUrl"><span style="color:#fff;" class="glyphicon glyphicon-pencil"></span></button>',
            '                    <button class="btn btn-xs btn-danger" data-bind="click: $root.deleteWidget"><span style="color:#fff;" class="glyphicon glyphicon-remove"></span></button>',
            '                </span>',
            '            </div>',
            '            <div class="rootFrame">',
            '            <iframe data-bind="attr: {src: link}" sandbox="allow-forms allow-scripts allow-same-origin" width="100%" />',
            '            </div>',                    
            '        </div>',
            '    </div>',
            '</div> '
        ].join('')
});

var vm;
$(function () {
    var ViewModel = function () {
        var self = this;
        
        this.dashboards = ko.observableArray([]);
        this.currentDashboard = ko.observable(null);
        
        this.addNewWidget = function () {
            var widget = new WidgetViewModel(++ids, 0, 0, 2, 2, "Untitled", "", true);
            self.currentDashboard().widgets.push(widget);
            self.save();
            
            return false;
        };
        
        this.deleteWidget = function (item) {
            self.currentDashboard().widgets.remove(item);
            self.save();
            
            return false;
        };
        
        this.openUrl = function (item) {
            window.location = item.link();
        }
        
        this.editUrl = function (item) {
            alertify.prompt("Change the link", "Please enter the url.", item.link(),
                function (evt, value) {
                    if (value) {
                        item.link(value);
                        self.save();
                    }
                }, function () {
                });
        }
        this.editTitle = function (item) {
            alertify.prompt("Change the title", "Please enter the title.", item.title(),
                function (evt, value) {
                    if (value) {
                        item.title(value);
                        self.save();
                    }
                }, function () {
                });
        }
        
        this.chooseDashboard = function (item) {
            if (self.currentDashboard() == item) {
                self.currentDashboard(null);
            } else {
                self.currentDashboard(null);
                self.currentDashboard(item);
            }
            self.save();
        }
        
        this.addNewDashboard = function () {
            self.dashboards.push(new DashboardViewModel("Untitled", []));
            self.save();
        }
        
        this.moveUpDashboard = function () {
            var i = self.dashboards.indexOf(self.currentDashboard());
            if (i >= 1) {
                var array = self.dashboards();
                self.dashboards.splice(i-1, 2, array[i], array[i-1]);
            }
            self.save();
        }
        
        this.moveDownDashboard = function () {
            var i = self.dashboards.indexOf(self.currentDashboard());
            if (i < self.dashboards().length - 1) {
                var array = self.dashboards();
                self.dashboards.splice(i, 2, array[i + 1], array[i]);
            }
            self.save();
        }
        
        this.renameDashboard = function () {
            alertify.prompt("Rename dashboard", "Please type the new dashboard name.", self.currentDashboard().title(),
                function (evt, value) {
                    if (value) {
                        self.currentDashboard().title(value);
                        self.save();
                    }
                }, function () {
                });
        }
        
        this.removeDashboard = function () {
            alertify.confirm("Remove dashboard?", "Are you sure you want to remove the dashboard?",
                function(){
                    self.dashboards.remove(self.currentDashboard());
                    self.currentDashboard(null);
                    self.save();
                },
                function(){
                });
        }
        
        this.importExport = function () {
            var data = localStorage.dashboards;
            alertify.prompt("Import / Export", "Export the string below. Share. Change the string below to import data.", data,
                function (evt, value) {
                    if (value) {
                        localStorage.dashboards = value;
                        self.load();
                    }
                }, function () {
                });
        }
        
        this.save = function () {
            var jsonData = ko.toJSON({
                version: 1,
                dashboards: self.dashboards(),
                currentDashboard: self.dashboards.indexOf(self.currentDashboard())
            });
            localStorage.dashboards = jsonData;
        }
        
        this.load = function () {
            // Load the saved data.
            var jsonData = localStorage.dashboards;
            
            // Unload everything.
            self.dashboards.removeAll();
            self.currentDashboard(null);
            
            // Saved data found.
            if (jsonData) {
                var savedData = JSON.parse(jsonData);
                for (var i = 0; i < savedData.dashboards.length; i++) {
                    var dashboard = savedData.dashboards[i];
                    
                    var widgets = [];
                    for (var j = 0; j < dashboard.widgets.length; j++) {
                        var widget = dashboard.widgets[j];
                        
                        var widgetViewModel = new WidgetViewModel(
                            ++ids,
                            widget.x,
                            widget.y,
                            widget.width,
                            widget.height,
                            widget.title,
                            widget.link,
                            false);
                        
                        widgets.push(widgetViewModel);
                    }
                    
                    var dashboardViewModel = new DashboardViewModel(dashboard.title, widgets);
                    self.dashboards.push(dashboardViewModel);
                }
                if (savedData.currentDashboard != -1) {
                    self.currentDashboard(self.dashboards()[savedData.currentDashboard]);
                }
                
            }
        }
        this.load();
    };

    var ids = 1;
    vm = new ViewModel();
    ko.applyBindings(vm);
});