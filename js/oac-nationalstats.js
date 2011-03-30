(function(nil) {
    OACGraph.implement('undeflinechart', function(x, y, w, h, xdata, ydata, opts) {
        ydata = (typeOf(ydata[0]) === 'array') ? ydata[0] : ydata;
        // xdata info
        var xdim = this.paper.g.snapEnds(0,ydata.length, ydata.length-1),
            minx = xdim.from,
            maxx = xdim.to,
            cleaned = [],
            kx = ( w - this.options.chartOptions.gutter * 2) / ((maxx - minx) || 1);
        console.log(xdim);
        for( var i=0, l=ydata.length, offset=0, cd=[]; i < l; i++ ) {
            if((ydata[i] === undefined) || (ydata[i] === null)) {
                offset++;
                if(cd.length > 0)
                    cleaned.push(cd);
                cd = [];
            } else {
                if(offset !== 0)
                    cleaned.push(offset);
                cd.push(ydata[i]);
                offset = 0;
            }
        }
        for( var i=0, l = cleaned.length, offset=0; i < l; i++ ) {
            if(typeOf(cleaned[i]) === 'array') {
                offset += cleaned[i].length;
                this.paper.path('M'+(x+ this.options.chartOptions.gutter + offset*kx)+" 0 L"+(x+ this.options.chartOptions.gutter + offset*kx)+" 1000");
            } else {
                offset += cleaned[i];
                this.paper.path('M'+(x+ this.options.chartOptions.gutter + offset*kx)+" 0 L"+(x+ this.options.chartOptions.gutter + offset*kx)+" 1000");
            }
        }
        console.log(cleaned);
        if( xdata === undefined ) xdata = [].range(0, ydata.length-1);
        return this.paper.g.linechart(x, y, w, h, [xdata], ydata, opts);
    });
}).call(this);

var OACNationalStats = new Class({
    Implements: [Options],
    
    options: {
        handler: (''.toURI().get('directory'))+'handler.php',
    	element: document.id('nationalstats-ui-container')
    },
    
    initialize: function( opts, scope ) {
        this.setOptions( opts );
        if( this.options.element == null ) return;
        this.scope = scope;
		this.ensocolors = [];
		this.graph = new OACGraph({
			element: document.id( 'commodity-graph' ), 
			height: 300,
			width: 600,
			type: 'undeflinechart',
			chartOptions: {
				centeraxis: false,
				shade: true,
				symbol: 'o'
			}
		});
        this.listReq = new Request.HTML({
            url: this.options.handler,
            evalScripts: false,
            method: 'post',
            onSuccess: function( res ) {
                var target = this.options.element.getElementById('commodity-container');
				target.empty().adopt( res );
				target.getElementById('commodity').addEvent( 'change', this.bound.graphReq );
				this.options.element.getElements('input[name="practice"]').addEvents({
					'change': this.bound.graphReq,
					'click' : function() { this.blur(); } 
				});
                this.bound.graphReq(); }.bind(this),
            onFailure: function() { alert( 'There was an error fetching the data' ); }
        });
        
        this.graphReq = new Request.JSON({
            url: this.options.handler,
            method: 'post',
            onSuccess: function( res ) { this.drawGraph( res ); }.bind(this),
            onFailure: function() { alert( 'There was an error fetching the data' ); }
        });
        
        this.bound = {
            listReq: function() {
                this.listReq.send({
                    data: {
                        route:    'getCommodities',
                        location: this.scope.finalElement.get( 'value' ),
                        type:     this.options.element.getElement( '#type' ).get( 'value' )
                    }
                });
            }.bind(this),
            
            graphReq: function() {
                this.graphReq.send({
                    data: {
                        route: 'getData',
                        location: this.scope.finalElement.get( 'value' ),
                        type:     this.options.element.getElementById( 'type' ).get( 'value' ),
                        crop:     this.options.element.getElementById( 'commodity' ).get( 'value' ),
						practice: this.options.element.getElement( 'input[name="practice"]:checked' ).get( 'value' )
                    }
                });
            }.bind(this)
        }
        $$('.oac-input').addEvent( 'change', this.bound.listReq );
        this.bound.listReq();
   },
   
	drawGraph: function( rawdata ) {
		var data = rawdata.data,
			years = rawdata.years,
			enso  = rawdata.enso;
		this.graph.rescale = true;
		this.graph.options.labels = years;
		this.graph.options.max = data.max();
		this.graph.options.min = 0;
		this.graph.options.graphOptions.xlabel = rawdata.xlabel;
		this.graph.redraw( data, true, years );
		// Add a color ENSO hack later
	}
});

document.addEvent('domready', function() {
    var nationalStatsHandler = (($$('script[src*="oac-nationalstats.js"]')[0].getProperty('src').toURI().get('directory'))+'../oac-nationalstats-ajax.php').toURI().toString(),
        nationalStatsElement = document.id( 'nationalstats-ui-container' ),
        nationalStats        = new OACNationalStats({
                handler: nationalStatsHandler, 
                element: nationalStatsElement
            }, 
            new OACScope({
                scope: 'location', 
                element: nationalStatsElement.getElementById( 'oac_scope_location' )
            })
        );
});
