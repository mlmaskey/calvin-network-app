
Polymer({
    is : 'cwn-cost-info',

    properties : {
        feature : {
            type : Object,
            observer : 'update'
        },
        hasTimeSeries : {
            type : Boolean,
            notify : true
        }
    },

    ready : function() {
      this.noCostData = true;
      this.costsMonths = [];
      this.costs = {
        label : '',
        data : {},
        cost : 0, // for constant costs
        selected : 0
      };

      this.constraintChart = {
          constant: -1,
          label : '',
          isTimeSeries : false,
          /*cols : [
              {id:'date', type:'string'},
              {id:'upper_value', type:'number'},
              {id:'upper_interval', type:'number', role:'interval'},
              {id:'lower_interval', type:'number', role:'interval'},
              {id: 'tooltip', type: 'string', role:'tooltip'}
          ],*/
          data : [],
          options : {
              series: [{'color': '#F1CA3A'}],
              intervals: { 'style':'area' },
              vAxis : {
                viewWindow:{ min: 0 }
              }
          }
      };

      this.months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],

      this.showCostData = false;
      this.showMonthlyVariableCost = false;
      this.showConstantCost = false;
      this.costChartLabel = '';
      this.costChartData = [];
      this.showBounds = false;
      this.showConstantBounds = false;
      this.showTimeSeriesBounds = false;
      this.showChartBounds = false;
      this.hasTimeSeries = false;
      this.charts = {};
    },

    update : function() {
        if( !this.feature ) return;

        this.noCostData = true;

        this.constraintChart.data = [];
        this.constraintChart.isTimeSeries = false;
        this.hasTimeSeries = false;
        this.constraintChart.constant = -1;
        this.constraintChart.label = '';

        this.showCostData = false;
        this.showMonthlyVariableCost = false;
        this.showConstantCost = false;
        this.showConstantBounds = false;
        this.$.constraintChartAnchor.innerHTML = '';
        this.showBounds = false;
        this.showConstantBounds = false;

        if( !this.feature.properties.costs || !this.feature.properties.bounds ) return;

        this.noCostData = false;
        this.showCostData = true;

        if( this.feature.properties.bounds ) this.renderBounds(this.feature.properties.bounds);


        this.renderCostData(this.feature.properties.costs);
    },



    renderCostData : function(d) {
      this.costs.label = d.type;


      if( d.type == 'Constant' ) {

        this.showConstantCost = true;
        this.costs.cost = d.cost;


      } else if( d.type == 'Monthly Variable' ) {

        this.showMonthlyVariableCost = true;

        this.costsMonths = {};
        var costArr;
        if( !d.costs ) return;

        if( d.costs.data ) {
          this.costMonths = d.costs.data;
        } else {
          this.costMonths = d.costs;
        }
        this.showMonthlyVariableCost = true;
        this.$.monthSelector.style.display = 'inline-block';

        this.setMonth('JAN');

      } else if( d.type == 'Annual Variable' ) {

        if( !d.costs ) return;

        var keys = Object.keys(d.costs);
        if( keys.length == 0 ) return;
        if( keys.length > 1 ) {
          console.log('! cwn-cost-info found multiple keys for costs data');
          console.log(keys);
        }

        this.costChartLabel = d.type+': '+keys[0];
        this.costChartData = d.costs[keys[0]];
        this.$.lineChart.update(this.costChartData);
        this.showMonthlyVariableCost = true;
        this.$.monthSelector.style.display = 'none';

      } else {
        alert('Unknown cost type: '+d.type);
      }
    },

    /*
      --LBC (Lower Bound Constant),
      --LBM (Lower Bound Monthly Varying)
      --LBT (Lower Bound Time Varying)
      --UBC (Upper Bound Constant)
      --UBM (Upper Bound Monthly Varying)
      --UBT (Upper Bound Time Varying)
      --EQC (Equality Constraint: constant, this requires a time-series data)
         -- is upper and lower bound, single line
      --EQT (Equality Constraint: time, this requires a time-series data)
        -- is upper and lower bound, single line
      --NOB (No Bounds)
    */
    renderBounds : function(bounds) {
      var data = {
        upper: null,
        lower : null,
        NOB : false,
        EQC : false,
        use : 'constant'
      }

      for( var i = 0; i < bounds.length; i++ ) {
        if( bounds[i].type == 'LBC' || bounds[i].type == 'LBM' || bounds[i].type == 'LBT') {
          data.lower = bounds[i];
          if( bounds[i].type != 'LBC' ) data.use = 'lower';

        } else if ( bounds[i].type == 'UBC' || bounds[i].type == 'UBM' || bounds[i].type == 'UBT' ) {
          data.upper = bounds[i];
          if( bounds[i].type == 'UBM' || bounds[i].type == 'UBT' ) {
            // if lower is date, we want to use the date
            if( !(bounds[i].type != 'UBM' && data.use == 'lower') ) data.use = 'upper';
          }

        } else if ( bounds[i].type == 'NOB' ) {
          data.NOB = true;

        // TODO: this should proly render a special case
        } else if ( bounds[i].type == 'EQC' || bounds[i].type == 'EQT' ) {
          data.EQC = true;
          data.lower = bounds[i];
          data.upper = bounds[i];
          data.use = 'upper';
        }

        if( bounds[i].type == 'UBT' || bounds[i].type == 'LBT' ||
            bounds[i].type == 'EQC' || bounds[i].type == 'EQT') {
          this.constraintChart.isTimeSeries = true;

        }
      }

      //  TODO: if NOB, just quit?
      if( data.NOB ) return;

      var chartData = [];

      var length = 1;
      if( data.upper && data.upper.type != 'UBC') {
        length = data.upper.bound.length;
      }
      if( data.lower && data.lower.type != 'LBC' && data.lower.bounds > length ) {
        length = data.lower.bound.length;
      }

      var header = ['Date'];
      if( data.upper ) header.push('Upper Bound');
      if( data.lower ) header.push('Lower Bound');

      if( length == 1 ) length = 12;  // TODO: if len == 1, should we just show text?
      for( var i = 0; i < length; i++ ) {
        this.appendBoundsRow(data, chartData, i);
      }

      this.constraintChart.data = chartData;
      this.updateConstraintUi();
    },

    appendBoundsRow : function(data, chartData, index) {
      var row = [], ud, ld;

      if( data.upper ) {
        ud = this.getBoundsRow(data.upper, index);
        row.push(ud[1]);
      }
      if( data.lower ) {
        ld = this.getBoundsRow(data.lower, index);
        row.push(ld[1]);
      }

      if( data.use == 'constant' ) row.splice(0, 0, index+'');
      else if( data.use == 'upper' ) row.splice(0, 0, ud[0]);
      else row.splice(0, 0, ld[0]);

      chartData.push(row);
    },

    getBoundsRow : function(data, index) {
      if( data.type == 'LBC' || data.type == 'UBC' ) {
        if( index == 0 ) return ['Constant Lower', 'Constant Lower']
        return ['', data.bound];
      }

      if( index > data.bound.length -1) {
        index = index % 12;
      }
      if( index > data.bound.length -1) {
        return ['Invalid', 0];
      }

      return data.bound[index];
    },

    /*renderBounds : function(bounds) {

      if( bounds.constraint_type == 'Bounded' ) {
        var length = this.getContraintsLength(bounds);
        if( length < 12 ) length = 12;

        for( var i = 0; i < length; i++ ) {
          this.constraintChart.data.push(this.getConstraintRow(bounds, i));
        }

      } else if( bounds.constraint_type == 'Constrained' ) {

        if( bounds.constraint.bound_type == 'Constant') {

          this.constraintChart.constant = bounds.constraint.bound;

        } else if( bounds.constraint.bound_type == 'Monthly') {

          for( var i = 0; i < 12; i++ ) {
            this.constraintChart.data.push([
              this.months[i],
              bounds.constraint.bound[i],
              null,
              null,
              'Constrained: '+bounds.constraint.bound[i]
            ]);
          }

        } if( bounds.constraint.bound_type == 'TimeSeries') {

          this.constraintChart.isTimeSeries = true;
          this.hasTimeSeries = true;
          for( var i = 0; i < bounds.constraint.bound.length; i++ ) {
            this.constraintChart.data.push([
              bounds.constraint.date[i],
              bounds.constraint.bound[i],
              null,
              null,
              'Constrained: '+bounds.constraint.bound[i]
            ]);
          }

        }

      } else {
        console.log('Unknown Constraint Type: '+bounds.constraint_type);
      }

      this.updateConstraintUi();
    },

    getConstraintRow : function(bounds, index) {
      var row = [];

      if( bounds.lower && bounds.lower.bound_type == 'TimeSeries' ) {
        row.push(bounds.lower.date[index]);
      } else if ( bounds.upper && bounds.upper.bound_type == 'TimeSeries' ) {
        row.push(bounds.upper.date[index]);
      } else {
        row.push(this.months[index]);
      }

      var tooltip = row[0]+'\n';

      if( bounds.upper ) {
        if( bounds.upper.bound_type == 'Constant' ) {
          row.push(bounds.upper.bound);
          row.push(bounds.upper.bound);
          tooltip += 'Upper: '+bounds.upper.bound;
        } else if ( bounds.upper.bound_type == 'TimeSeries' || bounds.upper.bound_type == 'Monthly') {
          var i = index;
          if( i > 11 && bounds.upper.bound_type == 'Monthly' ) {
            i = parseInt(row[0].split("-")[1])-1;
          }

          row.push(bounds.upper.bound[i]);
          row.push(bounds.upper.bound[i]);
          tooltip += 'Upper: '+bounds.upper.bound[i];
        } else if ( bounds.upper.bound_type == 'None' ) {
          tooltip += 'Upper: None';
        }
      }

      if( bounds.lower ) {

        if( bounds.lower.bound_type == 'Constant' ) {
          row.push(bounds.lower.bound);
          tooltip += ', Lower: '+bounds.lower.bound;
        } else if ( bounds.lower.bound_type == 'TimeSeries' || bounds.lower.bound_type == 'Monthly' ) {
          var i = index;
          if( i > 11 && bounds.upper.bound_type == 'Monthly' ) {
            i = parseInt(row[0].split("-")[1])-1;
          }

          row.push(bounds.lower.bound[i]);
          tooltip += ', Lower: '+bounds.lower.bound[i];
        } else if ( bounds.lower.bound_type == 'None' ) {
          row.push(0);
          tooltip += ', Lower: 0';
        } else {
           tooltip += ', Lower: Unknown';
        }

      }

      while(row.length < 4) row.push(null);

      row.push(tooltip);

      return row;
    },*/

    getContraintsLength : function(bounds) {
      var l = 0;
      if( bounds.lower ) {
        if( bounds.lower.bound_type == 'Constant' ) {
          l = 1;
        } else if ( bounds.lower.bound_type == 'TimeSeries' ) {
          this.constraintChart.isTimeSeries = true;
          this.hasTimeSeries = true;

          l = bounds.lower.bound.length;
        } else if ( bounds.lower.bound_type == 'Monthly' ) {
          l = bounds.lower.bound.length;
        }
      }
      if (bounds.upper ) {
        if( bounds.upper.bound_type == 'Constant' && l == 0 ) {
          l = 1;
        } else if(bounds.upper.bound_type == 'TimeSeries' && l < bounds.upper.bound.length ) {
          this.constraintChart.isTimeSeries = true;
          this.hasTimeSeries = true;

          l = bounds.upper.bound.length;
        } else if ( bounds.upper.bound_type == 'Monthly' && l < bounds.upper.bound.length ) {
          l = bounds.upper.bound.length;
        }
      }
      return l;
    },

    // used by the month selector to update Monthly Variable chart's current month
    // buttons for this UI are generated above.  Can take button click event
    // or month string
    setMonth : function(month) {
      if( typeof month == 'object' ) month = month.currentTarget.innerHTML;
      month = month.toUpperCase();

      this.costChartLabel = this.costs.label+' - '+month;
      this.costChartData = this.costMonths[month];

      // redraw chart
      this.$.lineChart.update(this.costChartData);
    },


    updateConstraintUi : function() {
        if( this.constraintChart.data.length != 0 || this.constraintChart.constant != -1 ) {
            this.showBounds = true;
        }

        if( this.constraintChart.constant != -1 ) {
            this.showConstantBounds = true;
        }

        this.$.constraintChartAnchor.innerHTML = '';
        this.charts.constraintChart = null;

        if( this.constraintChart.data.length != 0 ) {
            var isline = false;

            // stamp out cwn-date-linechart instead of just linechart
            if( this.constraintChart.isTimeSeries ) {
                this.hasTimeSeries = true;
                this.charts.constraintChart = this._stamp(this.$.constraintChartTimeSeries, 'cwn-date-linechart', this.constraintChart);
            } else {
                isline = true;
                this.charts.constraintChart = this.$.constraintChart.stamp(this.constraintChart);
            }


            this.$.constraintChartAnchor.appendChild(this.charts.constraintChart.root);

            if( isline ) {
              this.$.constraintChartAnchor.querySelector('cwn-linechart').update(this.constraintChart.data);
            }
        }
    },

    // dom-template: http://polymer.github.io/polymer/
    // doesn't seem to take variables when you stamp now :(
    // setting manually.
    _stamp : function(ele, query, data) {
      var template = ele.stamp();

      if( query && data ) {
        var newEle = template.root.querySelector(query);
        if( newEle ) {
          for( var key in data ) newEle[key] = data[key];
        }
      }

      return template;
    }

});
