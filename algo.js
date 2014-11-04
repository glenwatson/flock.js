function proximityNns(elements) {
	var sortedX, //Array sorted on .x
		sortedY; //Array sorted on .y
	/*
	 * binary search that rounds fraction-indexes up
	 * e.g. - binarySearchUpper([0,2], 1) === 1
	 */
	function binarySearchUpper(arr, val, cmp) {
		var low = 0, high = arr.length;
		var mid = -1, c = 0;
		while(low < high)	{
			mid = ~~((low + high)/2); //Math.floor()
			c = cmp(arr[mid], val);
			if(c < 0)	{
				low = mid + 1;
			} else if(c > 0) {
				high = mid;
			} else {
				return mid;
			}
			//console.log("mid=" + mid + ", c=" + c + ", low=" + low + ", high=" + high);
		}
		return low;
	};
	/*
	 * binary search that rounds fraction-indexes down
	 * e.g. - binarySearchUpper([0,2], 1) === 0
	 */
	function binarySearchLower(arr, val, cmp) {
		var low = -1, high = arr.length-1;
		var mid = -1, c = 0;
		while(low < high)	{
			mid = Math.ceil((low + high)/2);
			c = cmp(arr[mid], val);
			if(c < 0)	{
				low = mid;
			} else if(c > 0) {
				high = mid - 1;
			} else {
				return mid;
			}
			//console.log("mid=" + mid + ", c=" + c + ", low=" + low + ", high=" + high);
		}
		return low;
	};
	
	/*
	 * Insertion sort on an array
	 * Used since it is fast on almost sorted arrays
	 */
	function insertionSort(arr, cmp) {
		var len = arr.length, 
			i = -1, 
			j, 
			tmp;
		
		while (len--) {
			tmp = arr[++i];
			j = i;
			while (j-- && cmp(arr[j], tmp) > 0) {
				arr[j + 1] = arr[j];
			}
			arr[j + 1] = tmp;
		}
	};
	
	/*
	 * Returns a function that compares the passed in property
	 */
	function compareX(a, b) {
		return a.x - b.x;
	}
	function compareY(a, b) {
		return a.y - b.y;
	}
	
	/*
	 * Called with the initial elements to be sorted
	 * @param elements (array) - the elements in the search space. In the form {id: ?, x: ?, y: ?}
	 */
	function init(elements) {
		sortedX = elements
			.map(function(x){ return x; }) //copy the array
			.sort(compareX); //sort on x
		sortedY = elements
			.map(function(x){ return x; }) //copy the array
			.sort(compareY); //sort on y
	}
	
	/*
	 * Called after any element that was passed to init() has been updated
	 */
	function update() {
		insertionSort(sortedX, compareX); //almost sorted
		insertionSort(sortedY, compareY); //almost sorted
	}
	
	/*
	 * Searches the elements
	 * @param needle (object) - the point to search from. In the form {x: ?, y: ?}
	 * @param range (int) - the distance from needle to search
	 */
	function search(needle, range) {
		var lowIdxX = binarySearchUpper(sortedX, {x:needle.x - range}, compareX);
		var highIdxX = binarySearchLower(sortedX, {x:needle.x + range}, compareX);
		
		var lowIdxY = binarySearchUpper(sortedY, {y:needle.y - range}, compareY);
		var highIdxY = binarySearchLower(sortedY, {y:needle.y + range}, compareY);
		
		//hash the smaller set
		/*
		if (resultsX.length < resultsY.length) {
			var smallerResults = resultsX;
			var largerResults = resultsY;
		} else {
			var largerResults = resultsX;
			var smallerResults = resultsY;
		}
		*/
		//construct hash
		var smallestResultHash = {};
		var i = lowIdxX;
		while (i <= highIdxX) {
			smallestResultHash[sortedX[i].id] = true;
			i++;
		}
		//return the intersection
		var intersection = [];
		i = lowIdxY;
		while (i <= highIdxY) {
			if (smallestResultHash[sortedY[i].id]) {
				intersection.push(sortedY[i]);
			}
			i++;
		}
		return intersection;
	}
	
	init(elements);
	
	return {
		search: search,
		update: update,
	};
}
