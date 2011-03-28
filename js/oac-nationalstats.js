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
			type: 'linechart',
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
		this.graph.redraw( data, true, years );
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
