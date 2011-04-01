(function(nil) {
    OACGraph.implement('undeflinechart', function(x, y, w, h, xdata, ydata, opts) {
        ydata = (typeOf(ydata[0]) === 'array') ? ydata[0] : ydata;
        var len = w-this.options.chartOptions.gutter*2,
            kx = len / (ydata.length-1),
            max = Math.max.apply(Math, ydata),
            cleaned = [],
            charts = [];
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
            if(i + 1 === l) {
                if(cd.length > 0)
                    cleaned.push(cd);
            }
        }
        /* Guide lines for alignment math 
        for( var i=0, l = ydata.length, X=x+this.options.chartOptions.gutter; i < l; i++ ) {
            this.paper.path('M'+(X+.5)+" "+(y+this.options.chartOptions.vgutter)+" L"+(X+.5)+" "+(y+h-this.options.chartOptions.vgutter));
            X += kx;
        }
        */
        for( var i=0, l = cleaned.length, offset=0, d; i < l; i++ ) {
            if( typeOf(cleaned[i]) === 'array' ) {
                if( cleaned[i].length > 1 ) {
                    charts.push(this.paper.g.linechart(x+(offset*kx),y,((cleaned[i].length-1)*kx)+this.options.chartOptions.gutter*2,h,[].range(0, cleaned[i].length-1), cleaned[i], opts));
                } else {
                    charts.push(d = this.paper.g.dotchart(x+((offset+1)*kx)-10,y+this.options.chartOptions.vgutter/2, 10,h,[0,1,2], [0,cleaned[i][0], max], [0,cleaned[i][0],0], {max:5, colors: opts.colors}));
                    this.paper.path('M'+d.series[0].attrs.cx+' '+(d.series[0].attrs.cy+2.5)+' L'+d.series[0].attrs.cx+' '+(y+h-this.options.chartOptions.vgutter)).attr({'stroke-width': 2, 'stroke':opts.colors[0]}) ;
                }
                offset += cleaned[i].length;
            } else {
                offset += cleaned[i];
            }
        }
        return charts;
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
		this.ensocolors = ['#0c3', '#f00', '#3cf'];
		this.graph = new OACGraph({
			element: document.id( 'commodity-graph' ), 
			height: 300,
			width: 600,
			type: 'undeflinechart',
			chartOptions: {
				centeraxis: false,
				shade: true,
				symbol: 'o',
                colors:  ['#808000']
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
            onFailure: function() { alert( 'There was an error fetching the location data' ); }
        });
        
        this.graphReq = new Request.JSON({
            url: this.options.handler,
            onSuccess: function( res ) { this.drawGraph( res ); }.bind(this),
            onFailure: function() { alert( 'There was an error fetching the graph data' ); }
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
			enso  = rawdata.enso,
            colors = [];
		this.graph.rescale = true;
		this.graph.options.labels = years;
		this.graph.options.max = data.max();
		this.graph.options.min = 0;
        this.graph.options.graphOptions.title  = document.id('commodity').getSelected().get('html');
		this.graph.options.graphOptions.xlabel = rawdata.xlabel;
		this.graph.redraw( data, true, years, 10 );
		// Add a color ENSO hack later
        for( var i = 0, l = data.length, udef=true, ci=0; i < l; i++ ) {
            if( data[i] === undefined || data[i] === null ) {
                if( ! udef ) {
                    ci++;
                    udef = true;
                }
            } else {
                if(udef) {
                    colors[ci] = [this.ensocolors[enso[i]-1]];
                    udef = false;
                } else {
                    colors[ci].push( this.ensocolors[enso[i]-1] );
                }
            }
        }

        for( var i=0, l=this.graph.chart.chart.length; i < l; i++ ) {
            this.graph.chart.chart[i].each( function() {
                var dot = this.symbol || this.dot || undefined;
                if(dot === undefined) return;
                if(colors[i].length === 1) {
                    ci = 0
                } else {
                    ci = this.index;
                }
                dot.attr({'fill': colors[i][ci]});
            });
        }
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
